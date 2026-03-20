import bcrypt from 'bcryptjs'
import { z, } from 'zod'

import { protectedProcedure, createTRPCRouter, } from '~/server/api/trpc'
import { CURRENCY_CODES, } from '~/lib/currencies'

export const userRouter = createTRPCRouter({
  // Returns all profile + preference data needed by the settings page
  getProfile: protectedProcedure.query(async ({ ctx, }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      select: {
        baseCurrency: true,
        email: true,
        emailNotificationsDigest: true,
        emailNotificationsReceipt: true,
        name: true,
        password: true,
      },
      where: { id: ctx.session.user.id, },
    })
    return {
      baseCurrency: user.baseCurrency,
      email: user.email ?? '',
      emailNotificationsDigest: user.emailNotificationsDigest,
      emailNotificationsReceipt: user.emailNotificationsReceipt,
      hasPassword: !!user.password,
      name: user.name ?? '',
    }
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required').max(80),
      email: z.string().email('Invalid email'),
    }))
    .mutation(async ({ ctx, input, }) => {
      // Ensure new email isn't already taken by another user
      const existing = await ctx.db.user.findFirst({ where: { email: input.email, id: { not: ctx.session.user.id, }, }, })
      if (existing) throw new Error('Email is already in use.')

      return ctx.db.user.update({
        data: { email: input.email, name: input.name, },
        where: { id: ctx.session.user.id, },
      })
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ ctx, input, }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        select: { password: true, },
        where: { id: ctx.session.user.id, },
      })

      if (!user.password) throw new Error('No password set on this account.')

      const valid = await bcrypt.compare(input.currentPassword, user.password)
      if (!valid) throw new Error('Current password is incorrect.')

      const hashed = await bcrypt.hash(input.newPassword, 12)
      await ctx.db.user.update({
        data: { password: hashed, },
        where: { id: ctx.session.user.id, },
      })

      return { success: true, }
    }),

  updateNotifications: protectedProcedure
    .input(z.object({
      emailNotificationsDigest: z.boolean(),
      emailNotificationsReceipt: z.boolean(),
    }))
    .mutation(async ({ ctx, input, }) => ctx.db.user.update({
      data: input,
      where: { id: ctx.session.user.id, },
    })),

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

  deleteAccount: protectedProcedure.mutation(async ({ ctx, }) => {
    await ctx.db.user.delete({ where: { id: ctx.session.user.id, }, })
    return { success: true, }
  }),
})
