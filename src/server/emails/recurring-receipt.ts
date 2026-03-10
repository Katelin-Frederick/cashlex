type RecurringReceiptData = {
  amount: number
  date: Date
  name: string
  walletName: string
}

export const recurringReceiptHtml = ({
  amount, date, name, walletName,
}: RecurringReceiptData) => {
  const formattedDate = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Cashlex</p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Recurring Expense Receipt</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;color:#334155;font-size:15px;">
              A recurring expense was automatically processed on your account.
            </p>

            <!-- Receipt box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 16px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Transaction Details</p>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;color:#64748b;font-size:14px;">Expense</td>
                      <td align="right" style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Wallet</td>
                      <td align="right" style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;border-top:1px solid #e2e8f0;">${walletName}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Date</td>
                      <td align="right" style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;border-top:1px solid #e2e8f0;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:16px 0 8px;color:#64748b;font-size:14px;border-top:2px solid #cbd5e1;">Amount charged</td>
                      <td align="right" style="padding:16px 0 8px;color:#ef4444;font-size:20px;font-weight:700;border-top:2px solid #cbd5e1;">-$${amount.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              This charge was created automatically by your recurring expense schedule.
              To manage your recurring expenses, visit your Cashlex dashboard.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              You're receiving this because you have recurring expenses set up in Cashlex.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export const recurringReceiptSubject = (name: string, amount: number) => `Cashlex: ${name} — $${amount.toFixed(2)} processed`
