import { type DefaultSession, type NextAuthConfig, } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import Credentials from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import TwitchProvider from 'next-auth/providers/twitch'
import { DrizzleAdapter, } from '@auth/drizzle-adapter'
import { eq, } from 'drizzle-orm'
import bcrypt from 'bcrypt'

import {
  verificationTokens,
  sessions,
  accounts,
  users,
} from '~/server/db/schema'
import { db, } from '~/server/db'
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const authConfig = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      async profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          username: profile.username,
        }
      },
    }),
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
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!, // Add your Google Client ID from Google Developer Console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // Add your Google Client Secret
      async profile(profile) {
        console.log('Google profile', profile)
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      async profile(profile) {
        console.log('Twitch profile', profile)
        return {
          id: profile.id,
          name: profile.preferred_username,
          email: profile.email,
          username: profile.preferred_username,
        }
      },
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
          email: foundUser.email,
        }
      },
    })
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async jwt({ token, user, }) {
      if (user) {
        token.id = user.id
        token.email = user.email ?? null

        token.name = user.name ?? user.username ?? 'User'
      }
      return token
    },

    async session({ session, token, }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name!
        session.user.email = token.email!
      }
      return session
    },

    async redirect({ url, baseUrl, }) {
      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`
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
  },
} satisfies NextAuthConfig
