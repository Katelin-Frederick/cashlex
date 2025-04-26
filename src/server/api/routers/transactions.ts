import { eq, } from 'drizzle-orm'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { transactions, } from '~/server/db/schema'
import { db, } from '~/server/db'

// Schema used for input validation
const createTransactionSchema = z.object({
  paymentName: z.string().min(2),
  paymentType: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  paidDate: z.date(),
  budget: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
})

export const transactionRouter = createTRPCRouter({
  // GET all transactions for the current user
  getAll: protectedProcedure.query(async ({ ctx, }) => db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, ctx.session.user.id))
    .orderBy(transactions.paidDate)),

  // CREATE a new transaction
  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input, }) => {
      const result = await db.insert(transactions).values({
        ...input,
        userId: ctx.session.user.id,
      })
      return result
    }),

  // DELETE a transaction by ID
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), }))
    .mutation(async ({ ctx, input, }) => {
      const result = await db
        .delete(transactions)
        .where(eq(transactions.id, input.id))
      return result
    }),
})
