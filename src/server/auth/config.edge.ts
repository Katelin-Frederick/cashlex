import type { NextAuthConfig, } from 'next-auth'

/**
 * Edge-compatible auth config — no Prisma, no Node.js-only imports.
 * Used exclusively by middleware to verify JWT sessions without touching the database.
 * The full config (with Prisma adapter and providers) lives in config.ts.
 */
export const edgeAuthConfig = {
  providers: [],
  session: { strategy: 'jwt', },
  pages: {signIn: '/login',},
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
} satisfies NextAuthConfig