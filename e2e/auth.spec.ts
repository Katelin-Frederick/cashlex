import { expect, test } from '@playwright/test'

// These tests run against the live dev server (localhost:3000).
// They cover the full authentication flow end-to-end.

const TEST_EMAIL = 'e2e@example.com'
const TEST_PASSWORD = 'e2e-password-123'
const TEST_NAME = 'E2E Test User'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to the landing page', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/$|\/login/)
  })

  test('register flow creates an account and redirects to dashboard', async ({ page }) => {
    await page.goto('/')

    // Navigate to registration
    await page.getByRole('link', { name: /sign up|register|get started/i }).first().click()

    // Fill in the registration form
    await page.getByLabel(/name/i).fill(TEST_NAME)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    // Password fields — fill both if there is a confirm field
    const passwordFields = page.getByLabel(/password/i)
    await passwordFields.first().fill(TEST_PASSWORD)
    const count = await passwordFields.count()
    if (count > 1) await passwordFields.nth(1).fill(TEST_PASSWORD)

    await page.getByRole('button', { name: /register|sign up|create/i }).click()

    // Should land on dashboard or login after registration
    await expect(page).toHaveURL(/dashboard|login/, { timeout: 10_000 })
  })

  test('login flow with valid credentials reaches the dashboard', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /sign in|log in|login/i }).first().click()

    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in|login/i }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 })
  })

  test('login with wrong password shows an error', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in|log in|login/i }).first().click()

    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill('wrong-password')
    await page.getByRole('button', { name: /sign in|log in|login/i }).click()

    // Should stay on login page and show an error
    await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible({ timeout: 5_000 })
  })
})
