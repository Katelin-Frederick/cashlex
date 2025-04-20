import { CreditCard, CircleUser, PiggyBank, ChartPie, Banknote, Timer, Quote, Bell, } from 'lucide-react'
import Image from 'next/image'

import { Button, } from '~/components/ui/button'
import { HydrateClient, } from '~/trpc/server'
import { auth, } from '~/server/auth'

const Home = async () => {
  const session = await auth()

  if (session?.user) {
    console.log('Landing Session', session)
  }

  return (
    <HydrateClient>
      <div className='flex flex-col flex-1'>
        <main className='flex-1'>
          <section className='h-1/2 bg-green-100 flex flex-col items-center md:justify-normal md:flex-row p-12 border-b-5 border-gray-800'>
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
          </section>

          <div className='container mx-auto'>
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

            <section className='py-12'>
              <h2 className='text-2xl md:text-4xl font-bold text-center mb-8'>Key Features</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
                  <CreditCard size='48px' />
                  <h3 className='font-bold text-2xl my-4 text-center'>Expense Tracking</h3>

                  <p>
                    Add, edit, and delete transactions (expenses and income) with details like amount, category, and date.
                  </p>
                </div>

                <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
                  <ChartPie size='48px' />
                  <h3 className='font-bold text-2xl my-4 text-center'>Budgeting</h3>

                  <p>
                    Create and track category-based budgets, with real-time feedback and warnings when nearing limits.
                  </p>
                </div>

                <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
                  <Timer size='48px' />
                  <h3 className='font-bold text-2xl my-4 text-center'>Recurring Expenses</h3>

                  <p>
                    Set and automate repeating transactions (e.g., subscriptions, rent).
                  </p>
                </div>

                <div className='flex flex-col items-center bg-gray-500 border-3 border-gray-800 rounded-md p-5 shadow-lg'>
                  <Bell size='48px' />
                  <h3 className='font-bold text-2xl my-4 text-center'>Real-Time Notifications</h3>

                  <p>
                    Alerts for budget limits and due recurring payments.
                  </p>
                </div>
              </div>
            </section>

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
          </div>

          <section className='py-12 flex justify-center items-center flex-col bg-gray-500 border-t-5 border-gray-800 container'>
            <h2 className='text-2xl md:text-4xl font-bold text-center mb-8'>
              Ready to Master Your Finances?
            </h2>

            <p>
              Join thousands already managing their financial future.
            </p>

            <Button className='mt-8'>Sign Up Today</Button>
          </section>
        </main>
      </div>
    </HydrateClient>
  )
}

export default Home
