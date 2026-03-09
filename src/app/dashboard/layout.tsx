import type { ReactNode, } from 'react'

import { auth, } from '~/server/auth'

import { Nav, } from './_components/nav'

const DashboardLayout = async ({ children, }: { children: ReactNode }) => {
  const session = await auth()
  const userLabel = session?.user?.name ?? session?.user?.email ?? 'User'

  return (
    <div className='flex h-screen overflow-hidden'>
      <Nav userLabel={userLabel} />
      <main className='flex-1 overflow-y-auto bg-slate-50'>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
