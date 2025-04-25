import { eq, } from 'drizzle-orm'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { budgets, } from '~/server/db/schema'
import { db, } from '~/server/db'

export const budgetRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx, }) => {
    const results = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, ctx.session.user.id))

    return results.map((budget) => ({
      ...budget,
      amount: parseFloat(budget.amount as unknown as string),
      spent: parseFloat(budget.spent as unknown as string),
    }))
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      amount: z.string().refine((val) => parseFloat(val) > 0),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx, }) => db.insert(budgets).values({
      name: input.name,
      amount: parseFloat(input.amount),
      description: input.description,
      userId: ctx.session.user.id,
      spent: 0,
    }).returning()),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), }))
    .mutation(async ({ input, }) => db.delete(budgets).where(eq(budgets.id, input.id))),
})
