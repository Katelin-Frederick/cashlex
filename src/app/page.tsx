import {
  ArrowRight,
  BarChart3,
  RefreshCw,
  Shield,
  Wallet,
  Bell,
} from 'lucide-react'
import { redirect, } from 'next/navigation'
import Link from 'next/link'

import { Button, } from '~/components/ui/button'
import { auth, } from '~/server/auth'

const Feature = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className='rounded-xl border bg-white p-6 shadow-sm'>
    <div className='mb-3'>{icon}</div>
    <h3 className='mb-1 font-semibold text-slate-900'>{title}</h3>
    <p className='text-sm text-slate-500'>{description}</p>
  </div>
)

const LandingPage = async () => {
  const session = await auth()

  // Send logged-in users straight to the app
  if (session) redirect('/dashboard')

  return (
    <div className='flex min-h-screen flex-col bg-white'>
      {/* Nav */}
      <header className='flex items-center justify-between border-b px-6 py-4'>
        <span className='text-xl font-bold tracking-tight'>Cashlex</span>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' asChild>
            <Link href='/login'>Sign in</Link>
          </Button>
          <Button asChild>
            <Link href='/register'>Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className='flex flex-1 flex-col items-center justify-center px-6 py-24 text-center'>
        <h1 className='max-w-2xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl'>
          Your finances,{' '}
          <span className='text-emerald-600'>finally under control</span>
        </h1>
        <p className='mt-6 max-w-xl text-lg text-slate-500'>
          Track spending, set budgets, manage recurring expenses, and get
          real-time insights — all in one place.
        </p>
        <div className='mt-10 flex gap-4'>
          <Button size='lg' asChild>
            <Link href='/register'>
              Start for free <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/login'>Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className='bg-slate-50 px-6 py-20'>
        <div className='mx-auto max-w-5xl'>
          <h2 className='mb-12 text-center text-3xl font-bold text-slate-900'>
            Everything you need to manage your money
          </h2>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            <Feature
              icon={<Wallet className='h-6 w-6 text-emerald-600' />}
              title='Multiple Wallets'
              description='Track checking, savings, credit cards, and cash accounts in one unified view.'
            />
            <Feature
              icon={<BarChart3 className='h-6 w-6 text-emerald-600' />}
              title='Visual Insights'
              description='Charts and reports that show exactly where your money is going each month.'
            />
            <Feature
              icon={<RefreshCw className='h-6 w-6 text-emerald-600' />}
              title='Recurring Expenses'
              description='Set up subscriptions and bills once — Cashlex tracks and logs them automatically.'
            />
            <Feature
              icon={<Bell className='h-6 w-6 text-emerald-600' />}
              title='Smart Notifications'
              description='Get alerted when you approach a budget limit or a recurring expense is due.'
            />
            <Feature
              icon={<Shield className='h-6 w-6 text-emerald-600' />}
              title='Secure by Default'
              description='Your data is encrypted and protected. Sign in with Google or email and password.'
            />
            <Feature
              icon={<BarChart3 className='h-6 w-6 text-emerald-600' />}
              title='Budget Tracking'
              description='Set monthly or weekly spending limits per category and watch your progress in real time.'
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-6 py-20 text-center'>
        <h2 className='text-3xl font-bold text-slate-900'>
          Ready to take control?
        </h2>
        <p className='mt-3 text-slate-500'>
          Create your free account in under a minute.
        </p>
        <Button size='lg' className='mt-8' asChild>
          <Link href='/register'>
            Get started <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className='border-t px-6 py-6 text-center text-sm text-slate-400'>
        © {new Date().getFullYear()} Cashlex. Built with Next.js.
      </footer>
    </div>
  )
}

export default LandingPage
