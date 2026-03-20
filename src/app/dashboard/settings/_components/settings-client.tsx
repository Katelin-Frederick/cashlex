'use client'

import { zodResolver, } from '@hookform/resolvers/zod'
import { signOut, } from 'next-auth/react'
import { useForm, } from 'react-hook-form'
import { useState, } from 'react'
import { z, } from 'zod'

import {
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialog,
} from '~/components/ui/alert-dialog'
import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from '~/components/ui/form'
import {
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
  Select,
} from '~/components/ui/select'
import { CardDescription, CardContent, CardHeader, CardTitle, Card, } from '~/components/ui/card'
import { Button, } from '~/components/ui/button'
import { Switch, } from '~/components/ui/switch'
import { Input, } from '~/components/ui/input'
import { CURRENCIES, } from '~/lib/currencies'
import { api, } from '~/trpc/react'

// ── Profile section ───────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  email: z.string().email('Invalid email'),
})
type ProfileValues = z.infer<typeof profileSchema>

const ProfileSection = ({ name, email, }: { name: string; email: string }) => {
  const utils = api.useUtils()
  const [saved, setSaved] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email, },
  })

  const update = api.user.updateProfile.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your display name and email address.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => update.mutate(v))} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder='Your name' {...field} /></FormControl>
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
                  <FormControl><Input type='email' placeholder='you@example.com' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {update.error && (
              <p className='text-sm text-red-500'>{update.error.message}</p>
            )}
            <Button type='submit' disabled={update.isPending}>
              {saved ? 'Saved!' : update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ── Change password section ───────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordValues = z.infer<typeof passwordSchema>

const PasswordSection = () => {
  const [saved, setSaved] = useState(false)

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '', },
  })

  const change = api.user.changePassword.useMutation({
    onSuccess: () => {
      form.reset()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your sign-in password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => change.mutate({
              currentPassword: v.currentPassword,
              newPassword: v.newPassword,
            }))}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl><Input type='password' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl><Input type='password' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field, }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl><Input type='password' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {change.error && (
              <p className='text-sm text-red-500'>{change.error.message}</p>
            )}
            <Button type='submit' disabled={change.isPending}>
              {saved ? 'Updated!' : change.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ── Preferences section ───────────────────────────────────────────────

type PreferencesProps = {
  baseCurrency: string
  emailNotificationsDigest: boolean
  emailNotificationsReceipt: boolean
}

const PreferencesSection = ({ baseCurrency, emailNotificationsDigest, emailNotificationsReceipt, }: PreferencesProps) => {
  const utils = api.useUtils()

  const updateCurrency = api.user.updateBaseCurrency.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate()
      void utils.dashboard.stats.invalidate()
      void utils.dashboard.spendingByCategory.invalidate()
      void utils.dashboard.monthlyTrend.invalidate()
    },
  })

  const updateNotifications = api.user.updateNotifications.useMutation({ onSuccess: () => void utils.user.getProfile.invalidate(), })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Currency display and email notification settings.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Base currency */}
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium'>Base currency</p>
            <p className='text-muted-foreground text-xs'>Dashboard totals are converted to this currency.</p>
          </div>
          <Select
            value={baseCurrency}
            disabled={updateCurrency.isPending}
            onValueChange={(c) => updateCurrency.mutate({ currency: c, })}
          >
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <hr />

        {/* Receipt emails */}
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium'>Recurring expense receipts</p>
            <p className='text-muted-foreground text-xs'>Email me when a recurring expense is auto-processed.</p>
          </div>
          <Switch
            checked={emailNotificationsReceipt}
            disabled={updateNotifications.isPending}
            onCheckedChange={(checked) => updateNotifications.mutate({
              emailNotificationsDigest,
              emailNotificationsReceipt: checked,
            })}
          />
        </div>

        {/* Digest emails */}
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium'>Weekly spending digest</p>
            <p className='text-muted-foreground text-xs'>Email me a weekly summary every Sunday.</p>
          </div>
          <Switch
            checked={emailNotificationsDigest}
            disabled={updateNotifications.isPending}
            onCheckedChange={(checked) => updateNotifications.mutate({
              emailNotificationsDigest: checked,
              emailNotificationsReceipt,
            })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Danger zone ───────────────────────────────────────────────────────

const DangerZone = () => {
  const [open, setOpen] = useState(false)

  const deleteAccount = api.user.deleteAccount.useMutation({
    onSuccess: async () => {
      await signOut({ callbackUrl: '/', })
    },
  })

  return (
    <Card className='border-red-200'>
      <CardHeader>
        <CardTitle className='text-red-600'>Danger Zone</CardTitle>
        <CardDescription>Permanent actions that cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium'>Delete account</p>
            <p className='text-muted-foreground text-xs'>
              Permanently deletes your account and all data — wallets, transactions, budgets, and recurring expenses.
            </p>
          </div>
          <Button variant='destructive' onClick={() => setOpen(true)}>
            Delete account
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => deleteAccount.mutate()}
            >
              {deleteAccount.isPending ? 'Deleting…' : 'Yes, delete my account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────

export const SettingsClient = () => {
  const { data: profile, isLoading, } = api.user.getProfile.useQuery()

  if (isLoading) {
    return (
      <div className='flex min-h-100 items-center justify-center'>
        <p className='text-muted-foreground'>Loading settings…</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className='mx-auto max-w-2xl px-6 py-10 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Settings</h1>
        <p className='text-muted-foreground mt-1 text-sm'>Manage your profile and preferences.</p>
      </div>

      <ProfileSection name={profile.name} email={profile.email} />

      {profile.hasPassword && <PasswordSection />}

      <PreferencesSection
        baseCurrency={profile.baseCurrency}
        emailNotificationsDigest={profile.emailNotificationsDigest}
        emailNotificationsReceipt={profile.emailNotificationsReceipt}
      />

      <DangerZone />
    </div>
  )
}
