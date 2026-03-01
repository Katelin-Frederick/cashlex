import type { ReactNode, } from 'react'

const AuthLayout = ({ children, }: { children: ReactNode }) => (
  <div className='flex min-h-screen items-center justify-center bg-slate-50'>
    <div className='w-full max-w-md px-4'>{children}</div>
  </div>
)

export default AuthLayout
