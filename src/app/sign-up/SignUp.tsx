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
import { api, } from '~/trpc/react'

const formSchema = z
  .object({
    username: z.string().min(2, { message: 'Username must be at least 2 characters.', }),
    email: z.string().email({ message: 'Invalid email address', }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(32, 'Password must be less than 32 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const SignUp = () => {
  const router = useRouter()
  const { status, } = useSession()
  const [errorMessage, setErrorMessage] = useState('') // 🔴 Error message state

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: async (_data, variables) => {
      console.log('✅ User signed up successfully! Attempting auto-login...')
      const signInResult = await signIn('credentials', {
        redirect: false,
        username: variables.username,
        password: variables.password,
      })

      if (signInResult?.ok) {
        router.push('/dashboard')
      } else {
        console.error('⚠️ Auto-login failed:', signInResult?.error)
        router.push('/login')
      }
    },
    onError: (err) => {
      const message = err.message?.toLowerCase()
      if (message?.includes('username')) {
        setErrorMessage('Username already exists')
      } else if (message?.includes('email')) {
        setErrorMessage('Email already exists')
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage('')
    const { username, email, password, } = values

    try {
      await signUpMutation.mutateAsync({ username, email, password, })
    } catch (err) {
      console.error(err)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className='flex justify-center items-center my-12'>
      <div className='bg-gray-500 w-2xs md:w-96 p-7 rounded-md shadow-2xl'>
        <h1 className='text-2xl font-bold text-center mb-6'>Create an Account</h1>

        {/* Error Message UI */}
        {errorMessage && (
          <div className='bg-red-500 text-white text-center p-2 rounded mb-4'>
            {errorMessage}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-8 flex flex-col justify-center items-center w-full'
          >
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
              name='email'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='you@example.com' {...field} />
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

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='Confirm Password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full'>
              Sign Up
            </Button>

            <p>
              Already have an account?{' '}
              <Link href='/login' className='underline hover:text-gray-100'>
                Login
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default SignUp
