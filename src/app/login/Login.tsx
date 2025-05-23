'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useSession, signIn, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useEffect, useState, } from 'react'
import { useForm, } from 'react-hook-form'
import Link from 'next/link'
import { z, } from 'zod'

import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'

const Login = () => {
  const router = useRouter()
  const { status, } = useSession()
  const [errorMessage, setErrorMessage] = useState('') // 👈 Add error state

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const formSchema = z.object({
    username: z.string().min(2, { message: 'Username must be at least 2 characters.', }),
    password: z.string().min(2, { message: 'Password must be at least 2 characters.', }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage('') // 👈 Clear error on new submit
    const { username, password, } = values

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    })

    if (result?.error) {
      setErrorMessage('Invalid username or password.') // 👈 Set error here
    } else if (result?.ok) {
      router.push('/dashboard')
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className='flex justify-center items-center my-12'>
      <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl'>
        <h1 className='text-2xl font-bold text-center mb-6'>Login</h1>

        {/* Error Message UI */}
        {errorMessage && (
          <div className='bg-red-500 text-white text-center p-2 rounded mb-4'>
            {errorMessage}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='username'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='Username' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='Password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full'
            >
              Login
            </Button>
          </form>
        </Form>

        <div className='relative flex py-5 items-center'>
          <div className='flex-grow border-t border-gray-800'></div>
          <span className='flex-shrink mx-4 text-gray-800'>or</span>
          <div className='flex-grow border-t border-gray-800'></div>
        </div>

        <Button
          onClick={() => signIn('github', { callbackUrl: '/dashboard', })}
          className='w-full bg-[#181717]'
        >
          <svg width={24} fill='#FFFFFF' role='img' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><title>GitHub</title><path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' /></svg>
          <span className='ml-2'>Login with Github</span>
        </Button>

        <Button
          onClick={() => signIn('google', { callbackUrl: '/dashboard', })}
          className='w-full mt-3 bg-[#4285F4]'
        >
          <svg width={24} fill='#FFFFFF' role='img' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><title>Google</title><path d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z' /></svg>
          <span className='ml-2'>Login with Google</span>
        </Button>

        <Button
          onClick={() => signIn('discord', { callbackUrl: '/dashboard', })}
          className='w-full mt-3 bg-[#5865F2]'
        >
          <svg width={24} fill='#FFFFFF' role='img' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><title>Discord</title><path d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z' /></svg>
          <span className='ml-2'>Login with Discord</span>
        </Button>

        <Button
          onClick={() => signIn('twitch', { callbackUrl: '/dashboard', })}
          className='w-full mt-3 bg-[#9146FF]'
        >
          <svg width={24} fill='#FFFFFF' role='img' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><title>Twitch</title><path d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' /></svg>
          <span className='ml-2'>Login with Twitch</span>
        </Button>

        <p className='text-center mt-6'>
          Don&apos;t have an account? <Link href='/sign-up' className='underline hover:text-gray-100'>Sign Up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
