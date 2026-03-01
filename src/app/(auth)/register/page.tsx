'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { useForm, } from 'react-hook-form'
import { signIn, } from 'next-auth/react'
import { useState, } from 'react'
import Link from 'next/link'
import { z, } from 'zod'

import {
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Card,
} from '~/components/ui/card'
import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import { Separator, } from '~/components/ui/separator'
import { Button, } from '~/components/ui/button'
import { Input, } from '~/components/ui/input'
import { api, } from '~/trpc/react'

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const RegisterPage = () => {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '', email: '', password: '', confirmPassword: '',
    },
  })

  const register = api.auth.register.useMutation({
    onSuccess: async (_, variables) => {
      // After creating the account, sign in automatically
      await signIn('credentials', {
        email: variables.email,
        password: variables.password,
        callbackUrl: '/dashboard',
      })
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const onSubmit = (values: RegisterFormValues) => {
    setError(null)
    register.mutate({
      name: values.name,
      email: values.email,
      password: values.password,
    })
  }

  const onGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard', })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl'>Create an account</CardTitle>
        <CardDescription>
          Start managing your finances with Cashlex
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Google OAuth */}
        <Button
          variant='outline'
          className='w-full'
          onClick={onGoogleSignIn}
          type='button'
        >
          <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
            <path
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              fill='#4285F4'
            />
            <path
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              fill='#34A853'
            />
            <path
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              fill='#FBBC05'
            />
            <path
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              fill='#EA4335'
            />
          </svg>
          Continue with Google
        </Button>

        <div className='flex items-center gap-4'>
          <Separator className='flex-1' />
          <span className='text-muted-foreground text-sm'>or</span>
          <Separator className='flex-1' />
        </div>

        {/* Credentials form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {error && (
              <p className='text-destructive rounded-md bg-red-50 px-3 py-2 text-sm'>
                {error}
              </p>
            )}

            <FormField
              control={form.control}
              name='name'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Jane Smith' {...field} />
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
                    <Input type='password' placeholder='••••••••' {...field} />
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
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='••••••••' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full'
              disabled={register.isPending}
            >
              {register.isPending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className='justify-center'>
        <p className='text-muted-foreground text-sm'>
          Already have an account?{' '}
          <Link href='/login' className='text-primary hover:underline'>
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default RegisterPage
