import { TRPCError, } from '@trpc/server'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'

const frequencySchema = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])

const recurringInputSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  frequency: frequencySchema,
  name: z.string().min(1).max(50),
  nextDueDate: z.string().min(1),
  walletId: z.string().min(1),
})

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(9),
})

export const recurringExpenseRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx, }) =>
    ctx.db.recurringExpense.findMany({
      include: {
        category: { select: { color: true, icon: true, name: true, }, },
        wallet: { select: { name: true, }, },
      },
      orderBy: { nextDueDate: 'asc', },
      where: { userId: ctx.session.user.id, },
    })
  ),

  listPaginated: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input, }) => {
      const { page, pageSize, } = input
      const skip = (page - 1) * pageSize

      const [items, total] = await Promise.all([
        ctx.db.recurringExpense.findMany({
          include: {
            category: { select: { color: true, icon: true, name: true, }, },
            wallet: { select: { name: true, }, },
          },
          orderBy: { nextDueDate: 'asc', },
          skip,
          take: pageSize,
          where: { userId: ctx.session.user.id, },
        }),
        ctx.db.recurringExpense.count({ where: { userId: ctx.session.user.id, }, }),
      ])

      return { items, pageCount: Math.ceil(total / pageSize), total, }
    }),

  create: protectedProcedure
    .input(recurringInputSchema)
    .mutation(({ ctx, input, }) =>
      ctx.db.recurringExpense.create({
        data: {
          amount: input.amount,
          categoryId: input.categoryId ?? null,
          description: input.description ?? null,
          frequency: input.frequency,
          name: input.name,
          nextDueDate: new Date(input.nextDueDate),
          userId: ctx.session.user.id,
          walletId: input.walletId,
        },
      })
    ),

  update: protectedProcedure
    .input(recurringInputSchema.extend({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const existing = await ctx.db.recurringExpense.findUnique({
        where: { id: input.id, userId: ctx.session.user.id, },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring expense not found.', })

      return ctx.db.recurringExpense.update({
        data: {
          amount: input.amount,
          categoryId: input.categoryId ?? null,
          description: input.description ?? null,
          frequency: input.frequency,
          name: input.name,
          nextDueDate: new Date(input.nextDueDate),
          walletId: input.walletId,
        },
        where: { id: input.id, },
      })
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean(), }))
    .mutation(async ({ ctx, input, }) => {
      const existing = await ctx.db.recurringExpense.findUnique({
        where: { id: input.id, userId: ctx.session.user.id, },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring expense not found.', })

      return ctx.db.recurringExpense.update({
        data: { isActive: input.isActive, },
        where: { id: input.id, },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const existing = await ctx.db.recurringExpense.findUnique({
        where: { id: input.id, userId: ctx.session.user.id, },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring expense not found.', })

      await ctx.db.recurringExpense.delete({ where: { id: input.id, }, })
      return { success: true, }
    }),
})
