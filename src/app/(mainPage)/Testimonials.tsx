import { Quote, } from 'lucide-react'
import React from 'react'

const Testimonials = () => (
  <section className='py-12'>
    <h2 className='text-2xl md:text-4xl font-bold text-center mb-8'>What Users Are Saying</h2>

    <div>
      <Quote fill='#38A169' className='rotate-180 text-green-800' size='36px' />
      <p>
        Cashlex made budgeting so easy for me. I finally feel in control of my money without stressing over spreadsheets!
      </p>
      <span className='font-bold italic'>— Jordan R.</span>
    </div>

    <div className='mt-8'>
      <Quote fill='#38A169' className='rotate-180 text-green-800' size='36px' />
      <p>
        I used to feel overwhelmed by my finances, but Cashlex changed everything. Now I track my spending in minutes, not hours.
      </p>
      <span className='font-bold italic'>— Samantha T.</span>
    </div>

    <div className='mt-8'>
      <Quote fill='#38A169' className='rotate-180 text-green-800' size='36px' />
      <p>
        Thanks to Cashlex, I saved enough for my first big vacation. It made staying on track simple and even fun!
      </p>
      <span className='font-bold italic'>— Marcus D.</span>
    </div>

    <div className='mt-8'>
      <Quote fill='#38A169' className='rotate-180 text-green-800' size='36px' />
      <p>
        Cashlex gave me the confidence to set real financial goals and actually stick to them. I’ve never felt more in control of my future.
      </p>
      <span className='font-bold italic'>— Elena S.</span>
    </div>
  </section>
)

export default Testimonials