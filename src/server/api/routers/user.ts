import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { CURRENCY_CODES, } from '~/lib/currencies'

export const userRouter = createTRPCRouter({
  getBaseCurrency: protectedProcedure.query(async ({ ctx, }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      select: { baseCurrency: true, },
      where: { id: ctx.session.user.id, },
    })
    return user.baseCurrency
  }),

  updateBaseCurrency: protectedProcedure
    .input(z.object({ currency: z.string().refine((c) => CURRENCY_CODES.includes(c), 'Unsupported currency'), }))
    .mutation(async ({ ctx, input, }) => ctx.db.user.update({
      data: { baseCurrency: input.currency, },
      where: { id: ctx.session.user.id, },
    })),
})
