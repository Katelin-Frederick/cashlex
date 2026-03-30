type BillReminderData = {
  amount: number
  daysAhead: number
  dueDate: Date
  name: string
  userName: string
  walletName: string
}

export const billReminderSubject = (name: string, daysAhead: number): string => {
  if (daysAhead === 0) return `Bill Reminder: "${name}" is due today`
  if (daysAhead === 1) return `Bill Reminder: "${name}" is due tomorrow`
  return `Bill Reminder: "${name}" is due in ${daysAhead} days`
}

export const billReminderHtml = ({
  amount, daysAhead, dueDate, name, userName, walletName,
}: BillReminderData): string => {
  const dueDateStr = new Date(dueDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const dueLabel =
    daysAhead === 0 ? 'today' :
    daysAhead === 1 ? 'tomorrow' :
    `in ${daysAhead} days`

  const accentColor = daysAhead === 0 ? '#ef4444' : daysAhead === 1 ? '#f59e0b' : '#3b82f6'

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
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Bill Reminder</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 6px;color:#64748b;font-size:14px;">Hi ${userName},</p>
            <h1 style="margin:0 0 24px;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
              Your <span style="color:${accentColor};">${name}</span> bill is due ${dueLabel}
            </h1>

            <!-- Bill details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:16px;">
                        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Bill</p>
                        <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${name}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:16px;">
                        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Amount</p>
                        <p style="margin:0;color:#0f172a;font-size:24px;font-weight:700;">$${amount.toFixed(2)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:16px;">
                        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Due Date</p>
                        <p style="margin:0;color:${accentColor};font-size:15px;font-weight:600;">${dueDateStr}</p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Wallet</p>
                        <p style="margin:0;color:#0f172a;font-size:14px;">${walletName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              Make sure your wallet has sufficient funds before the due date.
              You can manage your recurring expenses in Cashlex under <strong>Recurring</strong>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Sent by <a href="#" style="color:#64748b;text-decoration:none;">Cashlex</a> · Bill Reminders
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
