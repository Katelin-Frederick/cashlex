import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHubProvider from 'next-auth/providers/github'
import Credentials from "next-auth/providers/credentials";
import { eq, } from 'drizzle-orm'
import bcrypt from 'bcrypt'

import { db } from "~/server/db";
import {
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async session({ session, token }) {
      // The token is passed here because you are using JWT sessions
      if (token?.id) {
        session.user.id = token.id;  // Set the user ID from the JWT token
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;  // Store the user ID in the JWT token when the user logs in
      }
      return token;
    },
  },
  session: {
    // Customize session expiration time (default is 30 days)
    maxAge: 30 * 24 * 60 * 60, // 30 days
    strategy: 'jwt', // Use JWT strategy, which doesn't require a database for session management
    updateAge: 24 * 60 * 60, // 24 hours, time between updates to the session
  },
} satisfies NextAuthConfig;
