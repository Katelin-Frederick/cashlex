import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

const DEBT_TYPES = ['CREDIT_CARD', 'STUDENT_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'PERSONAL_LOAN', 'MEDICAL', 'OTHER'] as const

const debtInputSchema = z.object({
  creditor: z.string().max(100).optional(),
  currentBalance: z.number().positive(),
  dueDay: z.number().int().min(1).max(31).optional(),
  interestRate: z.number().min(0).max(100).optional(),
  minimumPayment: z.number().min(0).optional(),
  name: z.string().min(1).max(50),
  notes: z.string().max(200).optional(),
  originalAmount: z.number().positive(),
  type: z.enum(DEBT_TYPES),
})

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(9),
})

export const debtRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.debt.findMany({
      include: { wallet: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      where: { userId: ctx.session.user.id },
    })
  ),

  listPaginated: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input
      const skip = (page - 1) * pageSize

      const [items, total] = await Promise.all([
        ctx.db.debt.findMany({
          include: { wallet: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          where: { userId: ctx.session.user.id },
        }),
        ctx.db.debt.count({ where: { userId: ctx.session.user.id } }),
      ])

      return { items, pageCount: Math.ceil(total / pageSize), total }
    }),

  create: protectedProcedure
    .input(debtInputSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.debt.create({
        data: {
          creditor: input.creditor,
          currentBalance: input.currentBalance,
          dueDay: input.dueDay,
          interestRate: input.interestRate,
          minimumPayment: input.minimumPayment,
          name: input.name,
          notes: input.notes,
          originalAmount: input.originalAmount,
          type: input.type,
          userId: ctx.session.user.id,
        },
        include: { wallet: { select: { id: true, name: true } } },
      })
    ),

  update: protectedProcedure
    .input(debtInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const debt = await ctx.db.debt.findUnique({ where: { id: input.id, userId: ctx.session.user.id } })
      if (!debt) throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found.' })

      // For wallet-linked debts, currentBalance is managed by the wallet sync — ignore user input
      const currentBalance = debt.walletId ? debt.currentBalance : input.currentBalance

      return ctx.db.debt.update({
        data: {
          creditor: input.creditor,
          currentBalance,
          dueDay: input.dueDay,
          interestRate: input.interestRate,
          minimumPayment: input.minimumPayment,
          name: debt.walletId ? debt.name : input.name,
          notes: input.notes,
          originalAmount: input.originalAmount,
          type: debt.walletId ? debt.type : input.type,
        },
        include: { wallet: { select: { id: true, name: true } } },
        where: { id: input.id },
      })
    }),

  makePayment: protectedProcedure
    .input(z.object({ amount: z.number().positive(), debtId: z.string(), walletId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const [debt, sourceWallet, linkedCreditWallet] = await Promise.all([
        ctx.db.debt.findUnique({ where: { id: input.debtId, userId } }),
        ctx.db.wallet.findUnique({ where: { id: input.walletId, userId } }),
        ctx.db.debt.findUnique({ where: { id: input.debtId, userId } }).then((d) =>
          d?.walletId ? ctx.db.wallet.findUnique({ where: { id: d.walletId } }) : null
        ),
      ])

      if (!debt) throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found.' })
      if (!sourceWallet) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wallet not found.' })
      if (debt.walletId && debt.walletId === input.walletId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot pay a debt using its linked credit card wallet.' })
      }

      return ctx.db.$transaction(async (prisma) => {
        await prisma.transaction.create({
          data: {
            amount: input.amount,
            debtId: input.debtId,
            description: `Payment toward "${debt.name}"`,
            type: 'EXPENSE',
            userId,
            walletId: input.walletId,
          },
        })

        await prisma.wallet.update({
          data: { balance: { decrement: input.amount } },
          where: { id: input.walletId },
        })

        if (debt.walletId && linkedCreditWallet) {
          // Linked: reduce CREDIT wallet balance; debt.currentBalance mirrors it
          const newCreditBalance = Math.max(0, linkedCreditWallet.balance - input.amount)
          const isPaidOff = newCreditBalance === 0
          await prisma.wallet.update({
            data: { balance: newCreditBalance },
            where: { id: debt.walletId },
          })
          return prisma.debt.update({
            data: { currentBalance: newCreditBalance, isPaidOff },
            where: { id: input.debtId },
          })
        }

        // Unlinked: manage currentBalance on the debt directly
        const newBalance = Math.max(0, debt.currentBalance - input.amount)
        const isPaidOff = newBalance === 0
        return prisma.debt.update({
          data: { currentBalance: newBalance, isPaidOff },
          where: { id: input.debtId },
        })
      })
    }),

  payments: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const debt = await ctx.db.debt.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!debt) throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found.' })

      return ctx.db.transaction.findMany({
        include: { wallet: { select: { name: true } } },
        orderBy: { date: 'desc' },
        where: { debtId: input.id },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const debt = await ctx.db.debt.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!debt) throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found.' })

      await ctx.db.debt.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
