import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Next.js module mocks ─────────────────────────────────────────────
// These modules are not available outside the Next.js runtime

vi.mock('server-only', () => ({}))

// Mock next-auth — prevents import-time failure caused by next/server not
// being resolvable outside the Next.js runtime. Integration tests bypass
// auth entirely by providing a mock session via createTestContext.
vi.mock('~/server/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}))
