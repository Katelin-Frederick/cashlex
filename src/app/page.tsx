
import Navbar from '~/components/Navbar/Navbar'
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
        <Navbar />

        <h1 className='text-2xl font-bold text-center'>Landing</h1>
      </main>
    </HydrateClient>
  )
}

export default Home