import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

const goalInputSchema = z.object({
  description: z.string().max(200).optional(),
  name: z.string().min(1).max(50),
  targetAmount: z.number().positive(),
  targetDate: z.string().optional(),
})

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(9),
})

export const savingsGoalRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.savingsGoal.findMany({
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
        ctx.db.savingsGoal.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          where: { userId: ctx.session.user.id },
        }),
        ctx.db.savingsGoal.count({ where: { userId: ctx.session.user.id } }),
      ])

      return { items, pageCount: Math.ceil(total / pageSize), total }
    }),

  create: protectedProcedure
    .input(goalInputSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.savingsGoal.create({
        data: {
          description: input.description,
          name: input.name,
          targetAmount: input.targetAmount,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          userId: ctx.session.user.id,
        },
      })
    ),

  update: protectedProcedure
    .input(goalInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.savingsGoal.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found.' })

      return ctx.db.savingsGoal.update({
        data: {
          description: input.description,
          name: input.name,
          targetAmount: input.targetAmount,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
        },
        where: { id: input.id },
      })
    }),

  addContribution: protectedProcedure
    .input(z.object({ amount: z.number().positive(), id: z.string(), walletId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const [goal, wallet] = await Promise.all([
        ctx.db.savingsGoal.findUnique({ where: { id: input.id, userId } }),
        ctx.db.wallet.findUnique({ where: { id: input.walletId, userId } }),
      ])

      if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found.' })
      if (!wallet) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wallet not found.' })

      const newSaved = goal.savedAmount + input.amount
      const isCompleted = newSaved >= goal.targetAmount

      const [updatedGoal] = await ctx.db.$transaction([
        ctx.db.savingsGoal.update({
          data: { isCompleted, savedAmount: newSaved },
          where: { id: input.id },
        }),
        ctx.db.transaction.create({
          data: {
            amount: input.amount,
            description: `Contribution to "${goal.name}"`,
            savingsGoalId: input.id,
            type: 'INCOME',
            userId,
            walletId: input.walletId,
          },
        }),
        ctx.db.wallet.update({
          data: { balance: { increment: input.amount } },
          where: { id: input.walletId },
        }),
      ])

      return updatedGoal
    }),

  contributions: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.db.savingsGoal.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found.' })

      return ctx.db.transaction.findMany({
        include: { wallet: { select: { name: true } } },
        orderBy: { date: 'desc' },
        where: { savingsGoalId: input.id },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.savingsGoal.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found.' })

      await ctx.db.savingsGoal.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
