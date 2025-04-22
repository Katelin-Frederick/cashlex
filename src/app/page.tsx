
import { HydrateClient, } from '~/trpc/server'
import { auth, } from '~/server/auth'

import Testimonials from './(mainPage)/Testimonials'
import CallToAction from './(mainPage)/CallToAction'
import KeyFeatures from './(mainPage)/KeyFeatures'
import Landing from './(mainPage)/Landing'
import About from './(mainPage)/About'

const Home = async () => {
  const session = await auth()

  if (session?.user) {
    console.log('Landing Session', session)
  }

  return (
    <HydrateClient>
      <div className='flex flex-col flex-1'>
        <main className='flex-1'>
          <Landing />

          <div className='container mx-auto'>
            <About />

            <KeyFeatures />

            <Testimonials />
          </div>

          <CallToAction />
        </main>
      </div>
    </HydrateClient>
  )
}

export default Home
