import Link from 'next/link'

import { HydrateClient, } from '~/trpc/server'
import { auth, } from '~/server/auth'

const Home = async () => {
  const session = await auth()

  if (session?.user) {
    console.log('Landing Session', session)
  }

  return (
    <HydrateClient>
      <main>
        <h1 className='text-2xl font-bold'>Landing</h1>

        <ul>
          <li className='text-blue-800 underline'><Link href='/register'>Register</Link></li>
          <li className='text-blue-800 underline'><Link href='/login'>Login</Link></li>
          <li className='text-blue-800 underline'><Link href='/dashboard'>Dashboard</Link></li>
        </ul>
      </main>
    </HydrateClient>
  )
}

export default Home