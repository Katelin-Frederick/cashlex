'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useSession, signIn, } from 'next-auth/react'
import { useRouter, } from 'next/navigation'
import { useForm, } from 'react-hook-form'
import { useEffect, } from 'react'
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

const Register = () => {
  const router = useRouter()
  const { status, } = useSession()

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

  const registerMutation = api.auth.register.useMutation({
    onSuccess: async (_data, variables) => {
      console.log('✅ User registered successfully! Attempting auto-login...')

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
      console.log(err.message ?? '❌ Something went wrong during registration')
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { username, email, password, } = values
    await registerMutation.mutateAsync({ username, email, password, })
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='username'
            render={({ field, }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder='username' {...field} />
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
                  <Input type='password' placeholder='password' {...field} />
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
                  <Input type='password' placeholder='confirm password' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit'>Register User</Button>
        </form>
      </Form>
    </div>
  )
}

export default Register
