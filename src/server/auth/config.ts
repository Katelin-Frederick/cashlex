import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHubProvider from 'next-auth/providers/github'
import Credentials from "next-auth/providers/credentials";
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

import { db } from "~/server/db";
import {
  sessions,
  users,
  accounts,
  verificationTokens,
} from "~/server/db/schema";
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      async profile(profile) {
        console.log('profile', profile)
        return {
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
          username: profile.login,
        };
      }
    }),
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        console.log('Attempting to authorize with:', credentials)

        if (!credentials?.username || !credentials?.password) return null

        const user = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username))
          .limit(1)
          .execute()

        if (user.length === 0) return null

        const foundUser = user[0]
        console.log('Found user:', foundUser)

        const passwordMatch = await bcrypt.compare(credentials.password, foundUser.passwordHash)
        if (!passwordMatch) return null

        return {
          id: foundUser.id,
          name: foundUser.username,
          email: foundUser.email
        }
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? null;

        token.name = user.name ?? user.username ?? "User";
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
    },
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,
    strategy: 'jwt',
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/api/auth/error',
  }
} satisfies NextAuthConfig;
