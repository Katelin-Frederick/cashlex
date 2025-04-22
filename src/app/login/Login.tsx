'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useSession, signIn, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useEffect, useState, } from 'react'
import { useForm, } from 'react-hook-form'
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

        {/* ... (the rest of your social login buttons and sign up link) */}
      </div>
    </div>
  )
}

export default Login
