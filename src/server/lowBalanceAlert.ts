import { db } from '~/server/db'
import { sendMail } from '~/server/mailer'
import { lowBalanceHtml, lowBalanceSubject } from '~/server/emails/low-balance'

const WALLET_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT: 'Credit Card',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
}

/**
 * Called after any transaction mutates a wallet balance.
 * Fires a one-time alert email when the balance drops below the threshold,
 * and re-arms the alert when the balance recovers above it.
 * CREDIT wallets are skipped — their balance represents debt, not available funds.
 */
export const checkLowBalance = async (walletId: string, newBalance: number): Promise<void> => {
  const wallet = await db.wallet.findUnique({
    include: { user: { select: { email: true, emailNotificationsLowBalance: true, name: true } } },
    where: { id: walletId },
  })

  if (!wallet || !wallet.lowBalanceAlert || wallet.type === 'CREDIT') return

  if (newBalance < wallet.lowBalanceThreshold && !wallet.lowBalanceAlertSentAt) {
    // Balance just dropped below threshold — stamp and email
    await db.wallet.update({ data: { lowBalanceAlertSentAt: new Date() }, where: { id: walletId } })

    if (wallet.user.email && wallet.user.emailNotificationsLowBalance) {
      sendMail({
        html: lowBalanceHtml({
          balance: newBalance,
          currency: wallet.currency,
          threshold: wallet.lowBalanceThreshold,
          userName: wallet.user.name ?? 'there',
          walletName: wallet.name,
          walletType: WALLET_TYPE_LABELS[wallet.type] ?? wallet.type,
        }),
        subject: lowBalanceSubject(wallet.name),
        to: wallet.user.email,
      }).catch((err) => console.error(`[lowBalance] Alert email failed for "${wallet.name}":`, err))
    }
  } else if (newBalance >= wallet.lowBalanceThreshold && wallet.lowBalanceAlertSentAt) {
    // Balance recovered above threshold — re-arm
    await db.wallet.update({ data: { lowBalanceAlertSentAt: null }, where: { id: walletId } })
  }
}
