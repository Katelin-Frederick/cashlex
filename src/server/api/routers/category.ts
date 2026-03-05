import { TRPCError, } from '@trpc/server'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'

const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER'])

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export const categoryRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx, }) => ctx.db.category.findMany({
    where: { userId: ctx.session.user.id, },
    include: { _count: { select: { transactions: true, }, }, },
    orderBy: [{ type: 'asc', }, { name: 'asc', }],
  })
  ),

  listPaginated: protectedProcedure
    .input(paginationSchema.extend({type: transactionTypeSchema.optional(),}))
    .query(async ({ ctx, input, }) => {
      const where = {
        userId: ctx.session.user.id,
        ...(input.type ? { type: input.type, } : {}),
      }
      const skip = (input.page - 1) * input.pageSize
      const [items, total] = await Promise.all([
        ctx.db.category.findMany({
          include: { _count: { select: { transactions: true, }, }, },
          orderBy: [{ type: 'asc', }, { name: 'asc', }],
          skip,
          take: input.pageSize,
          where,
        }),
        ctx.db.category.count({ where, })
      ])
      return { items, pageCount: Math.ceil(total / input.pageSize), total, }
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required').max(50),
      type: transactionTypeSchema,
      icon: z.string().max(2).optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input, }) => ctx.db.category.create({data: { ...input, userId: ctx.session.user.id, },})
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50),
      type: transactionTypeSchema,
      icon: z.string().max(2).optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input, }) => {
      const { id, ...data } = input

      const category = await ctx.db.category.findUnique({where: { id, userId: ctx.session.user.id, },})
      if (!category) throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found.', })

      return ctx.db.category.update({ where: { id, }, data, })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), }))
    .mutation(async ({ ctx, input, }) => {
      const category = await ctx.db.category.findUnique({where: { id: input.id, userId: ctx.session.user.id, },})
      if (!category) throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found.', })

      await ctx.db.category.delete({ where: { id: input.id, }, })
      return { success: true, }
    }),
})
