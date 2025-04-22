import { CircleUser, PiggyBank, Banknote, } from 'lucide-react'
import React from 'react'

const About = () => (
  <section className='py-12'>
    <h2 className='text-2xl md:text-4xl font-bold text-center mb-8'>What is Cashlex?</h2>

    <p>
      Cashlex is a personal finance manager built to help you take control of your money with confidence.
      Whether you&apos;re tracking daily expenses, setting a budget, or planning for the future, Cashlex
      makes managing your finances simple, secure, and stress-free. We believe that financial planning
      should be easy and accessible for everyone — no experience required.
    </p>

    <div className='w-full flex justify-center items-center flex-col'>
      <ul>
        <li className='my-5'>
          <div className='flex items-center'>
            <div className='mr-5'>
              <CircleUser size={28} className='text-green-800 font-bold self-start' />
            </div>
            <p>Designed for real people, not accountants.</p>
          </div>
        </li>

        <li className='mb-5'>
          <div className='flex items-center'>
            <div className='mr-5'>
              <PiggyBank size={28} className='text-green-800 font-bold self-start' />
            </div>
            <p>Built to help you spend smarter, save faster, and stress less.</p>
          </div>
        </li>

        <li className='mb-5'>
          <div className='flex items-center'>
            <div className='mr-5'>
              <Banknote size={28} className='text-green-800 font-bold self-start' />
            </div>
            <p>No jargon. No guesswork. Just your money, made easy.</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
)

export default About