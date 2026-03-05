import { TRPCError, } from '@trpc/server'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'

const budgetPeriodSchema = z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'])

const budgetInputSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  endDate: z.string().min(1),
  name: z.string().min(1).max(50),
  period: budgetPeriodSchema,
  startDate: z.string().min(1),
})

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(9),
})

export const budgetRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx, }) => {
    const budgets = await ctx.db.budget.findMany({
      include: {
        category: {
          select: {
            color: true, icon: true, id: true, name: true, type: true,
          },
        },
      },
      orderBy: { startDate: 'desc', },
      where: { userId: ctx.session.user.id, },
    })

    return Promise.all(
      budgets.map(async (budget) => {
        const result = await ctx.db.transaction.aggregate({
          _sum: { amount: true, },
          where: {
            categoryId: budget.categoryId,
            date: { gte: budget.startDate, lte: budget.endDate, },
            type: 'EXPENSE',
            userId: ctx.session.user.id,
          },
        })
        return { ...budget, spent: result._sum.amount ?? 0, }
      })
    )
  }),

  listPaginated: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input, }) => {
      const { page, pageSize, } = input
      const skip = (page - 1) * pageSize

      const [budgets, total] = await Promise.all([
        ctx.db.budget.findMany({
          include: {
            category: {
              select: {
                color: true, icon: true, id: true, name: true, type: true,
              },
            },
          },
          orderBy: { startDate: 'desc', },
          skip,
          take: pageSize,
          where: { userId: ctx.session.user.id, },
        }),
        ctx.db.budget.count({ where: { userId: ctx.session.user.id, }, })
      ])

      const items = await Promise.all(
        budgets.map(async (budget) => {
          const result = await ctx.db.transaction.aggregate({
            _sum: { amount: true, },
            where: {
              categoryId: budget.categoryId,
              date: { gte: budget.startDate, lte: budget.endDate, },
              type: 'EXPENSE',
              userId: ctx.session.user.id,
            },
          })
          return { ...budget, spent: result._sum.amount ?? 0, }
        })
      )

      return { items, pageCount: Math.ceil(total / pageSize), total, }
    }),

  create: protectedProcedure
    .input(budgetInputSchema)
    .mutation(({ ctx, input, }) => {
      const endDate = new Date(input.endDate)
      endDate.setHours(23, 59, 59, 999)
      return ctx.db.budget.create({
        data: {
          amount: input.amount,
          categoryId: input.categoryId,
          endDate,
          name: input.name,
          period: input.period,
          startDate: new Date(input.startDate),
          userId: ctx.session.user.id,
        },
      })
    }),

  update: protectedProcedure
    .input(budgetInputSchema.extend({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const budget = await ctx.db.budget.findUnique({ where: { id: input.id, userId: ctx.session.user.id, }, })
      if (!budget) throw new TRPCError({ code: 'NOT_FOUND', message: 'Budget not found.', })

      const endDate = new Date(input.endDate)
      endDate.setHours(23, 59, 59, 999)
      return ctx.db.budget.update({
        data: {
          amount: input.amount,
          categoryId: input.categoryId,
          endDate,
          name: input.name,
          period: input.period,
          startDate: new Date(input.startDate),
        },
        where: { id: input.id, },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const budget = await ctx.db.budget.findUnique({ where: { id: input.id, userId: ctx.session.user.id, }, })
      if (!budget) throw new TRPCError({ code: 'NOT_FOUND', message: 'Budget not found.', })

      await ctx.db.budget.delete({ where: { id: input.id, }, })
      return { success: true, }
    }),
})
