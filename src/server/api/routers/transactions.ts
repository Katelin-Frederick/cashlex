import { sql, eq, } from 'drizzle-orm'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { transactions, budgets, } from '~/server/db/schema'
import { db, } from '~/server/db'

const createTransactionSchema = z.object({
  paymentName: z.string().min(2),
  paymentType: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  paidDate: z.date(),
  budgetId: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
})

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx, }) => db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, ctx.session.user.id))
    .orderBy(transactions.paidDate)),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx, }) => {
      const userId = ctx.session.user.id

      await ctx.db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          userId,
          paymentName: input.paymentName,
          paymentType: input.paymentType,
          amount: input.amount,
          paidDate: input.paidDate,
          budgetId: input.budgetId ?? null,
          category: input.category ?? null,
        })

        if (input.paymentType === 'expense' && input.budgetId) {
          await tx
            .update(budgets)
            .set({ spent: sql`${budgets.spent} + ${input.amount}`, })
            .where(eq(budgets.id, input.budgetId))
        }
      })

      return { success: true, }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), }))
    .mutation(async ({ ctx, input, }) => {
      const result = await db
        .delete(transactions)
        .where(eq(transactions.id, input.id))
      return result
    }),
})
