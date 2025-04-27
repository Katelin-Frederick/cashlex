import { sql, and, eq, } from 'drizzle-orm'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { transactions, budgets, } from '~/server/db/schema'
import { db, } from '~/server/db'

const createTransactionSchema = z.object({
  paymentName: z.string().min(2, { message: 'Payment name must be at least 2 characters.', }),
  paymentType: z.enum(['income', 'expense']),
  amount: z.number().positive({ message: 'Amount must be positive.', }),
  paidDate: z.date(),
  budgetId: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
})

export const transactionRouter = createTRPCRouter({
  getTotalIncome: protectedProcedure.query(async ({ ctx, }) => {
    const result = await db
      .select({ totalIncome: sql`SUM(${transactions.amount})`.as('totalIncome'), })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, ctx.session.user.id)
        )
      )

    const totalIncome = result.length > 0 ? Number(result[0]?.totalIncome ?? 0) : 0

    return { totalIncome, }
  }),

  getAllIncome: protectedProcedure.query(async ({ ctx, }) => {
    const result = await db
      .select({ allIncome: sql`SUM(${transactions.amount})`.as('allIncome'), })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, ctx.session.user.id),
          eq(transactions.paymentType, 'income')
        )
      )

    const allIncome = result.length > 0 ? Number(result[0]?.allIncome ?? 0) : 0

    return { allIncome, }
  }),

  getAllExpenses: protectedProcedure.query(async ({ ctx, }) => {
    const result = await db
      .select({ allExpenses: sql`SUM(${transactions.amount})`.as('allExpenses'), })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, ctx.session.user.id),
          eq(transactions.paymentType, 'expense')
        )
      )

    const allExpenses = result.length > 0 ? Number(result[0]?.allExpenses ?? 0) : 0

    return { allExpenses, }
  }),

  getAll: protectedProcedure.query(async ({ ctx, }) => db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, ctx.session.user.id))
    .orderBy(transactions.paidDate)
  ),

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
          budgetId: input.budgetId && input.paymentType === 'expense' ? input.budgetId : null,
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
      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, input.id))
        .limit(1)
        .then((result) => result[0])

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      const { budgetId, amount, paymentType, } = transaction

      await ctx.db.transaction(async (tx) => {
        if (paymentType === 'expense' && budgetId) {
          await tx
            .update(budgets)
            .set({ spent: sql`${budgets.spent} - ${amount}`, })
            .where(eq(budgets.id, budgetId))
        }

        await tx.delete(transactions).where(eq(transactions.id, input.id))
      })

      return { success: true, }
    }),
})
