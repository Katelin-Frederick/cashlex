import Image from 'next/image'
import React from 'react'

import { Button, } from '~/components/ui/button'

const Landing = () => (
  <section className='h-1/2 bg-green-100 p-12 border-b-5 border-gray-800 flex justify-center items-center'>
    <div className='max-w-5xl flex flex-col items-center md:justify-normal md:flex-row'>
      <div className='w-full md:w-1/2 flex flex-col justify-center items-center md:items-start'>
        <h1 className='text-5xl md:text-7xl font-bold mb-5'>Cashlex</h1>

        <h2 className='text-2xl md:text-3xl font-bold mb-5 text-center md:text-left'>
          Smart finances start here
        </h2>

        <h3 className='text-xl md:text-2xl mb-8 text-center md:text-left'>
          Take control of your financial life with Cashlex
        </h3>

        <Button className='max-w-max'>Get Started</Button>
      </div>

      <div className='w-full md:w-1/2 flex justify-center items-center mt-8 md:mt-0 ml-0 md:ml-8'>
        <Image
          src='/images/landing.gif'
          alt='Hero Animation'
          width={500}
          height={500}
          priority
        />
      </div>
    </div>
  </section>
)

export default Landing