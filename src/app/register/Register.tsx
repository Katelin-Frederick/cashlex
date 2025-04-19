'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
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
import { api, } from '~/trpc/react'

const Register = () => {
  const registerMutation = api.auth.register.useMutation({
    onSuccess: () => {
      console.log('User registered successfully!')
    },
    onError: (err) => {
      console.log(err.message ?? 'Something went wrong')
    },
  })

  const formSchema = z.object({
    username: z.string().min(2, {message: 'Username must be at least 2 characters.',}),
    email: z.string().email({ message: 'Invalid email address', }),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(32, 'Password must be less than 32 characters'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { username, email, password, } = values
    await registerMutation.mutateAsync({ username, email, password, })
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

          <Button type='submit'>Register User</Button>
        </form>
      </Form>
    </div>
  )
}

export default Register