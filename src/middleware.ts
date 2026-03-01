import { NextResponse, } from 'next/server'
import NextAuth from 'next-auth'

import { edgeAuthConfig, } from '~/server/auth/config.edge'

const { auth, } = NextAuth(edgeAuthConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname, } = req.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicPage = pathname === '/'

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login (landing page is public)
  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  // Exclude NextAuth routes, tRPC API routes, and Next.js internals.
  // tRPC endpoints are protected at the procedure level via protectedProcedure.
  matcher: ['/((?!api/auth|api/trpc|_next/static|_next/image|favicon.ico).*)'],
}