export const register = async () => {
  // Only run in Node.js runtime — not in Edge runtime or during build
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCron, } = await import('~/server/cron')
    startCron()
  }
}
