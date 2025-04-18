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

const Login = () => {
  const router = useRouter()
  const { status, } = useSession()

  // ✅ Redirect to /dashboard if already logged in
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
    const { username, password, } = values

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    })

    if (result?.error) {
      console.log('Invalid username or password.')
    } else if (result?.ok) {
      router.push('/dashboard')
    }
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

          <Button type='submit'>Login</Button>
        </form>
      </Form>

      <Button onClick={() => signIn('github', { callbackUrl: '/dashboard', })}>
        Sign In with Github
      </Button>

      <Button onClick={() => signIn('google', { callbackUrl: '/dashboard', })}>
        Sign In with Google
      </Button>

      <Button onClick={() => signIn('discord', { callbackUrl: '/dashboard', })}>
        Sign In with Discord
      </Button>

      <Button onClick={() => signIn('twitch', { callbackUrl: '/dashboard', })}>
        Sign In with Twitch
      </Button>
    </div>
  )
}

export default Login
