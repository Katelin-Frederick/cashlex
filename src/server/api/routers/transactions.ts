import { differenceInMonths, startOfMonth, addMonths, parseISO, format, } from 'date-fns'
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
  getSummary: protectedProcedure.query(async ({ ctx, }) => {
    const result = await db
      .select({
        income: sql`SUM(CASE WHEN ${transactions.paymentType} = 'income' THEN ${transactions.amount} ELSE 0 END)`.as('income'),
        expense: sql`SUM(CASE WHEN ${transactions.paymentType} = 'expense' THEN ${transactions.amount} ELSE 0 END)`.as('expense'),
      })
      .from(transactions)
      .where(eq(transactions.userId, ctx.session.user.id))

    const income = Number(result[0]?.income ?? 0)
    const expense = Number(result[0]?.expense ?? 0)
    const netTotal = income - expense

    return {
      netTotal,
      income,
      expense,
    }
  }),

  getExpenseBreakdown: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input, }) => {
      const { startDate, endDate, } = input

      const result = await db
        .select({
          category: transactions.category,
          total: sql`SUM(${transactions.amount})`.as('total'),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.session.user.id),
            eq(transactions.paymentType, 'expense'),
            startDate ? sql`${transactions.paidDate} >= ${startDate}::timestamp with time zone` : sql`1 = 1`,
            endDate ? sql`${transactions.paidDate} <= ${endDate}::timestamp with time zone` : sql`1 = 1`
          )
        )
        .groupBy(transactions.category)

      return result.map((row) => ({
        name: row.category && row.category.trim() !== '' ? row.category : 'Uncategorized',
        value: Number(row.total),
      }))
    }),

  getIncomeBreakdown: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input, }) => {
      const { startDate, endDate, } = input

      const result = await db
        .select({
          category: transactions.category,
          total: sql`SUM(${transactions.amount})`.as('total'),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.session.user.id),
            eq(transactions.paymentType, 'income'),
            startDate ? sql`${transactions.paidDate} >= ${startDate}::timestamp with time zone` : sql`1 = 1`,
            endDate ? sql`${transactions.paidDate} <= ${endDate}::timestamp with time zone` : sql`1 = 1`
          )
        )
        .groupBy(transactions.category)

      return result.map((row) => ({
        name: row.category && row.category.trim() !== '' ? row.category : 'Uncategorized',
        value: Number(row.total),
      }))
    }),

  getMonthlyBreakdown: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input, }) => {
      const endDate = input.endDate
        ? startOfMonth(parseISO(input.endDate))
        : startOfMonth(new Date())

      const startDate = input.startDate
        ? startOfMonth(parseISO(input.startDate))
        : startOfMonth(addMonths(endDate, -4)) // fallback last 5 months

      // Calculate how many months between start and end dates (inclusive)
      const monthsDiff = differenceInMonths(endDate, startDate) + 1

      // Generate array of months from startDate to endDate
      const months = []
      for (let i = 0; i < monthsDiff; i++) {
        const date = addMonths(startDate, i)
        months.push(format(date, 'yyyy-MM'))
      }

      // Format safeStartDate and safeEndDate for SQL filter
      const safeStartDate = format(startDate, 'yyyy-MM-dd')
      const safeEndDate = format(addMonths(endDate, 1), 'yyyy-MM-dd')

      const result = await db
        .select({
          month: sql`TO_CHAR(${transactions.paidDate}, 'YYYY-MM')`.as('month'),
          income: sql`SUM(CASE WHEN ${transactions.paymentType} = 'income' THEN ${transactions.amount} ELSE 0 END)`.as('income'),
          expense: sql`SUM(CASE WHEN ${transactions.paymentType} = 'expense' THEN ${transactions.amount} ELSE 0 END)`.as('expense'),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.session.user.id),
            sql`${transactions.paidDate} >= ${safeStartDate}::timestamp`,
            sql`${transactions.paidDate} < ${safeEndDate}::timestamp`
          )
        )
        .groupBy(sql`TO_CHAR(${transactions.paidDate}, 'YYYY-MM')`)

      // Map results to month keys
      const resultMap = new Map(result.map(r => [r.month, r]))

      // Fill in months with data or zeroes
      const filled = months.map(month => {
        const match = resultMap.get(month)
        return {
          month,
          income: match ? Number(match.income) : 0,
          expense: match ? Number(match.expense) : 0,
        }
      })

      return filled
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
