type BudgetAlertData = {
  budgetName: string
  categoryName: string
  limit: number
  spent: number
  threshold: number
  userName: string
}

export const budgetAlertSubject = (budgetName: string, percent: number) =>
  `Budget Alert: "${budgetName}" has reached ${percent}%`

export const budgetAlertHtml = ({
  budgetName, categoryName, limit, spent, threshold, userName,
}: BudgetAlertData) => {
  const percent = Math.round((spent / limit) * 100)
  const remaining = limit - spent
  const isOver = spent > limit
  const barColor = isOver ? '#ef4444' : '#f59e0b'
  const barWidth = Math.min(percent, 100)

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
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Budget Alert</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 6px;color:#64748b;font-size:14px;">Hi ${userName},</p>
            <h1 style="margin:0 0 24px;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
              ${isOver ? 'You\'ve exceeded your budget' : `You\'ve reached ${percent}% of your budget`}
            </h1>

            <!-- Budget details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Budget</p>
                  <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">${budgetName}</p>
                  <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Category</p>
                  <p style="margin:0 0 20px;color:#0f172a;font-size:14px;">${categoryName}</p>

                  <!-- Progress bar -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                    <tr>
                      <td style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
                        <table height="8" cellpadding="0" cellspacing="0">
                          <tr><td style="background:${barColor};border-radius:4px;width:${barWidth}%;height:8px;display:block;"></td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Spent / limit row -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:${barColor};font-size:15px;font-weight:600;">$${spent.toFixed(2)} spent</td>
                      <td align="right" style="color:#64748b;font-size:14px;">of $${limit.toFixed(2)}</td>
                    </tr>
                  </table>

                  <p style="margin:8px 0 0;color:${isOver ? '#ef4444' : '#64748b'};font-size:13px;">
                    ${isOver
                      ? `$${Math.abs(remaining).toFixed(2)} over budget`
                      : `$${remaining.toFixed(2)} remaining`}
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              This alert fired because spending reached your ${Math.round(threshold * 100)}% threshold.
              You can adjust or disable this alert in Cashlex under <strong>Budgets</strong>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Sent by <a href="#" style="color:#64748b;text-decoration:none;">Cashlex</a> · Budget Alerts
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
