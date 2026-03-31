import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { checkBudgetAlerts, } from '~/server/budgetAlerts'
import { checkLowBalance, } from '~/server/lowBalanceAlert'

const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER'])

const transactionInputSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().min(1).optional(),
  date: z.string().min(1),
  description: z.string().optional(),
  type: transactionTypeSchema,
  walletId: z.string().min(1),
})

// INCOME adds to balance; EXPENSE and TRANSFER deduct from it
const getBalanceDelta = (type: 'EXPENSE' | 'INCOME' | 'TRANSFER', amount: number) => type === 'INCOME' ? amount : -amount

export const transactionRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        type: transactionTypeSchema.optional(),
        walletId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input, }) => ctx.db.transaction.findMany({
      include: {
        category: {
          select: {
            color: true, icon: true, id: true, name: true,
          },
        },
        wallet: {
          select: {
            currency: true, id: true, name: true, type: true,
          },
        },
      },
      orderBy: { date: 'desc', },
      where: {
        userId: ctx.session.user.id,
        ...(input?.type ? { type: input.type, } : {}),
        ...(input?.walletId ? { walletId: input.walletId, } : {}),
      },
    })
    ),

  listPaginated: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(10),
      search: z.string().optional(),
      type: transactionTypeSchema.optional(),
      walletId: z.string().optional(),
    }))
    .query(async ({ ctx, input, }) => {
      const where = {
        userId: ctx.session.user.id,
        ...(input.type ? { type: input.type, } : {}),
        ...(input.walletId ? { walletId: input.walletId, } : {}),
        ...(input.search ? { description: { contains: input.search, mode: 'insensitive' as const, }, } : {}),
      }
      const skip = (input.page - 1) * input.pageSize
      const [items, total] = await Promise.all([
        ctx.db.transaction.findMany({
          include: {
            category: {
              select: {
                color: true, icon: true, id: true, name: true,
              },
            },
            wallet: {
              select: {
                currency: true, id: true, name: true, type: true,
              },
            },
          },
          orderBy: { date: 'desc', },
          skip,
          take: input.pageSize,
          where,
        }),
        ctx.db.transaction.count({ where, })
      ])
      return { items, pageCount: Math.ceil(total / input.pageSize), total, }
    }),

  create: protectedProcedure
    .input(transactionInputSchema)
    .mutation(async ({ ctx, input, }) => {
      const tx = await ctx.db.$transaction(async (prisma) => {
        const created = await prisma.transaction.create({
          data: {
            amount: input.amount,
            categoryId: input.categoryId ?? null,
            date: new Date(input.date),
            description: input.description ?? null,
            type: input.type,
            userId: ctx.session.user.id,
            walletId: input.walletId,
          },
        })
        const updatedWallet = await prisma.wallet.update({
          data: { balance: { increment: getBalanceDelta(input.type, input.amount), }, },
          select: { balance: true },
          where: { id: input.walletId, userId: ctx.session.user.id, },
        })
        await prisma.debt.updateMany({
          data: { currentBalance: updatedWallet.balance, isPaidOff: updatedWallet.balance <= 0 },
          where: { walletId: input.walletId },
        })
        return { created, walletBalance: updatedWallet.balance }
      })
      if (input.type === 'EXPENSE' && input.categoryId) {
        checkBudgetAlerts(ctx.session.user.id, input.categoryId)
          .catch((err) => console.error('[budget] Alert check failed:', err))
      }
      checkLowBalance(input.walletId, tx.walletBalance)
        .catch((err) => console.error('[lowBalance] Check failed:', err))
      return tx.created
    }),

  update: protectedProcedure
    .input(transactionInputSchema.extend({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const tx = await ctx.db.$transaction(async (prisma) => {
        const old = await prisma.transaction.findUniqueOrThrow({ where: { id: input.id, userId: ctx.session.user.id, }, })

        const reverseDelta = -getBalanceDelta(old.type, old.amount)
        const newDelta = getBalanceDelta(input.type, input.amount)

        const updated = await prisma.transaction.update({
          data: {
            amount: input.amount,
            categoryId: input.categoryId ?? null,
            date: new Date(input.date),
            description: input.description ?? null,
            type: input.type,
            walletId: input.walletId,
          },
          where: { id: input.id, },
        })

        const balances: { walletId: string; balance: number }[] = []

        if (old.walletId !== input.walletId) {
          // Reverse old wallet, apply to new wallet separately
          const oldWallet = await prisma.wallet.update({
            data: { balance: { increment: reverseDelta, }, },
            select: { balance: true },
            where: { id: old.walletId, userId: ctx.session.user.id, },
          })
          await prisma.debt.updateMany({
            data: { currentBalance: oldWallet.balance, isPaidOff: oldWallet.balance <= 0 },
            where: { walletId: old.walletId },
          })
          balances.push({ walletId: old.walletId, balance: oldWallet.balance })

          const newWallet = await prisma.wallet.update({
            data: { balance: { increment: newDelta, }, },
            select: { balance: true },
            where: { id: input.walletId, userId: ctx.session.user.id, },
          })
          await prisma.debt.updateMany({
            data: { currentBalance: newWallet.balance, isPaidOff: newWallet.balance <= 0 },
            where: { walletId: input.walletId },
          })
          balances.push({ walletId: input.walletId, balance: newWallet.balance })
        } else {
          const updatedWallet = await prisma.wallet.update({
            data: { balance: { increment: reverseDelta + newDelta, }, },
            select: { balance: true },
            where: { id: input.walletId, userId: ctx.session.user.id, },
          })
          await prisma.debt.updateMany({
            data: { currentBalance: updatedWallet.balance, isPaidOff: updatedWallet.balance <= 0 },
            where: { walletId: input.walletId },
          })
          balances.push({ walletId: input.walletId, balance: updatedWallet.balance })
        }

        return { updated, oldCategoryId: old.categoryId, balances }
      })

      const categoryId = input.categoryId ?? tx.oldCategoryId ?? undefined
      if ((input.type === 'EXPENSE' || tx.updated.type === 'EXPENSE') && categoryId) {
        checkBudgetAlerts(ctx.session.user.id, categoryId)
          .catch((err) => console.error('[budget] Alert check failed:', err))
      }
      for (const { walletId, balance } of tx.balances) {
        checkLowBalance(walletId, balance)
          .catch((err) => console.error('[lowBalance] Check failed:', err))
      }
      return tx.updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const { type, categoryId, walletId, walletBalance } = await ctx.db.$transaction(async (prisma) => {
        const old = await prisma.transaction.findUniqueOrThrow({ where: { id: input.id, userId: ctx.session.user.id, }, })
        const updatedWallet = await prisma.wallet.update({
          data: { balance: { increment: -getBalanceDelta(old.type, old.amount), }, },
          select: { balance: true },
          where: { id: old.walletId, userId: ctx.session.user.id, },
        })
        await prisma.debt.updateMany({
          data: { currentBalance: updatedWallet.balance, isPaidOff: updatedWallet.balance <= 0 },
          where: { walletId: old.walletId },
        })
        await prisma.transaction.delete({ where: { id: input.id, }, })
        return { type: old.type, categoryId: old.categoryId, walletId: old.walletId, walletBalance: updatedWallet.balance }
      })
      if (type === 'EXPENSE' && categoryId) {
        checkBudgetAlerts(ctx.session.user.id, categoryId)
          .catch((err) => console.error('[budget] Alert check failed:', err))
      }
      checkLowBalance(walletId, walletBalance)
        .catch((err) => console.error('[lowBalance] Check failed:', err))
    }),
})
