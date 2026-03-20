import { recurringExpenseRouter, } from '~/server/api/routers/recurringExpense'
import { createCallerFactory, createTRPCRouter, } from '~/server/api/trpc'
import { transactionRouter, } from '~/server/api/routers/transaction'
import { dashboardRouter, } from '~/server/api/routers/dashboard'
import { categoryRouter, } from '~/server/api/routers/category'
import { budgetRouter, } from '~/server/api/routers/budget'
import { walletRouter, } from '~/server/api/routers/wallet'
import { reportRouter, } from '~/server/api/routers/report'
import { authRouter, } from '~/server/api/routers/auth'
import { userRouter, } from '~/server/api/routers/user'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  budget: budgetRouter,
  category: categoryRouter,
  dashboard: dashboardRouter,
  recurringExpense: recurringExpenseRouter,
  report: reportRouter,
  transaction: transactionRouter,
  user: userRouter,
  wallet: walletRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
