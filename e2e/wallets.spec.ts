import { expect, test } from '@playwright/test'

// Reuse the credentials created in auth.spec.ts
const TEST_EMAIL = 'e2e@example.com'
const TEST_PASSWORD = 'e2e-password-123'

// Helper: log in and navigate to wallets
async function loginAndGoToWallets(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto('/')
  await page.getByRole('link', { name: /sign in|log in|login/i }).first().click()
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|log in|login/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 10_000 })
  await page.goto('/dashboard/wallets')
}

test.describe('Wallets', () => {
  test('wallets page loads and shows the add wallet button', async ({ page }) => {
    await loginAndGoToWallets(page)
    await expect(page.getByRole('button', { name: /add wallet/i })).toBeVisible()
  })

  test('can create a new wallet', async ({ page }) => {
    await loginAndGoToWallets(page)

    await page.getByRole('button', { name: /add wallet/i }).click()

    // Fill in the dialog
    await page.getByLabel(/wallet name/i).fill('E2E Checking')
    // Currency select defaults — no need to change

    await page.getByRole('button', { name: /^create$/i }).click()

    // New wallet card should appear
    await expect(page.getByText('E2E Checking')).toBeVisible({ timeout: 5_000 })
  })

  test('can edit a wallet name', async ({ page }) => {
    await loginAndGoToWallets(page)

    // Click the Edit button on the first wallet card
    await page.getByRole('button', { name: /^edit$/i }).first().click()

    const nameInput = page.getByLabel(/wallet name/i)
    await nameInput.clear()
    await nameInput.fill('Renamed Wallet')

    await page.getByRole('button', { name: /save changes/i }).click()

    await expect(page.getByText('Renamed Wallet')).toBeVisible({ timeout: 5_000 })
  })

  test('can delete a wallet', async ({ page }) => {
    await loginAndGoToWallets(page)

    // Count wallets before
    const cardsBefore = await page.getByRole('button', { name: /^delete$/i }).count()

    await page.getByRole('button', { name: /^delete$/i }).first().click()
    // Confirm in the alert dialog
    await page.getByRole('button', { name: /^delete$/i }).last().click()

    // One fewer delete button should remain
    await expect(page.getByRole('button', { name: /^delete$/i })).toHaveCount(
      Math.max(0, cardsBefore - 1),
      { timeout: 5_000 }
    )
  })
})
