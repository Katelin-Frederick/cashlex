import { TRPCError, } from '@trpc/server'
import { eq, } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { z, } from 'zod'

import { createTRPCRouter, publicProcedure, } from '~/server/api/trpc'
import { users, } from '~/server/db/schema'
import { db, } from '~/server/db'

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        username: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, }) => {
      const { username, email, password, } = input

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username))

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already exists',
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await db.insert(users).values({
        username,
        email,
        passwordHash: hashedPassword,
      })

      return { success: true, }
    }),
})
