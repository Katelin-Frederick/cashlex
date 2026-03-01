import { signOut, auth, } from '~/server/auth'

const DashboardPage = async () => {
  const session = await auth()

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4'>
      <h1 className='text-3xl font-bold'>Dashboard</h1>
      <p className='text-muted-foreground'>
        Welcome, {session?.user?.name ?? session?.user?.email}
      </p>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/login', })
        }}
      >
        <button
          type='submit'
          className='rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700'
        >
          Sign out
        </button>
      </form>
    </main>
  )
}

export default DashboardPage
