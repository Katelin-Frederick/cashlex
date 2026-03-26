import { TRPCError, } from '@trpc/server'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'

const walletTypeSchema = z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'INVESTMENT'])

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export const walletRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx, }) => ctx.db.wallet.findMany({
    where: { userId: ctx.session.user.id, },
    include: { _count: { select: { transactions: true, }, }, },
    orderBy: { createdAt: 'desc', },
  })
  ),

  listPaginated: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input, }) => {
      const where = { userId: ctx.session.user.id, }
      const skip = (input.page - 1) * input.pageSize
      const [items, total] = await Promise.all([
        ctx.db.wallet.findMany({
          include: { _count: { select: { transactions: true, }, }, },
          orderBy: { createdAt: 'desc', },
          skip,
          take: input.pageSize,
          where,
        }),
        ctx.db.wallet.count({ where, })
      ])
      return { items, pageCount: Math.ceil(total / input.pageSize), total, }
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required').max(50),
      type: walletTypeSchema,
      balance: z.number().default(0),
      currency: z.string().length(3).default('USD'),
    }))
    .mutation(async ({ ctx, input, }) => {
      const wallet = await ctx.db.wallet.create({
        data: { ...input, userId: ctx.session.user.id, },
      })

      if (input.type === 'CREDIT') {
        await ctx.db.debt.create({
          data: {
            currentBalance: input.balance ?? 0,
            name: input.name,
            originalAmount: input.balance ?? 0,
            type: 'CREDIT_CARD',
            userId: ctx.session.user.id,
            walletId: wallet.id,
          },
        })
      }

      return wallet
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50),
      type: walletTypeSchema,
      currency: z.string().length(3).default('USD'),
    }))
    .mutation(async ({ ctx, input, }) => {
      const { id, ...data } = input

      const wallet = await ctx.db.wallet.findUnique({ where: { id, userId: ctx.session.user.id, }, })
      if (!wallet) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wallet not found.', })

      const updatedWallet = await ctx.db.wallet.update({ where: { id, }, data, })

      if (wallet.type === 'CREDIT' && input.type === 'CREDIT') {
        // Sync name change to linked debt
        if (wallet.name !== input.name) {
          await ctx.db.debt.updateMany({ where: { walletId: id }, data: { name: input.name } })
        }
      } else if (wallet.type === 'CREDIT' && input.type !== 'CREDIT') {
        // Wallet is no longer CREDIT — remove the auto-created debt
        await ctx.db.debt.deleteMany({ where: { walletId: id } })
      } else if (wallet.type !== 'CREDIT' && input.type === 'CREDIT') {
        // Wallet just became CREDIT — create a linked debt
        await ctx.db.debt.create({
          data: {
            currentBalance: wallet.balance,
            name: input.name,
            originalAmount: wallet.balance,
            type: 'CREDIT_CARD',
            userId: ctx.session.user.id,
            walletId: id,
          },
        })
      }

      return updatedWallet
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const wallet = await ctx.db.wallet.findUnique({ where: { id: input.id, userId: ctx.session.user.id, }, })
      if (!wallet) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wallet not found.', })

      // Delete linked debt before deleting the wallet (SetNull would orphan it)
      if (wallet.type === 'CREDIT') {
        await ctx.db.debt.deleteMany({ where: { walletId: input.id } })
      }

      await ctx.db.wallet.delete({ where: { id: input.id, }, })
      return { success: true, }
    }),
})
