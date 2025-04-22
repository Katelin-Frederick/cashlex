import React from 'react'

import { Button, } from '~/components/ui/button'

const CallToAction = () => (
  <section className='py-12 flex justify-center items-center flex-col bg-gray-500 border-t-5 border-gray-800'>
    <h2 className='text-2xl md:text-4xl font-bold text-center mb-8'>
      Ready to Master Your Finances?
    </h2>

    <p>
      Join thousands already managing their financial future.
    </p>

    <Button className='mt-8'>Sign Up Today</Button>
  </section>
)

export default CallToAction