import { type DefaultSession, type NextAuthConfig, } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter, } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { z, } from 'zod'

import { db, } from '~/server/db'
import { env, } from '~/env'

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authConfig = {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({where: { email: parsed.data.email, },})

        // No user found, or user registered via OAuth (no password)
        if (!user?.password) return null

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.password
        )
        if (!passwordMatch) return null

        return user
      },
    })
  ],
  adapter: PrismaAdapter(db),
  session: {
    // Credentials provider requires JWT strategy because the Prisma adapter
    // only handles database sessions for OAuth flows by default.
    strategy: 'jwt',
  },
  callbacks: {
    jwt: ({ token, user, }) => {
      if (user) token.id = user.id
      return token
    },
    session: ({ session, token, }) => {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  pages: {signIn: '/login',},
} satisfies NextAuthConfig
