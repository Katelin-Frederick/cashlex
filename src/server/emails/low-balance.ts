type LowBalanceData = {
  balance: number
  currency: string
  threshold: number
  userName: string
  walletName: string
  walletType: string
}

export const lowBalanceSubject = (walletName: string) =>
  `Low Balance Alert: "${walletName}" is running low`

export const lowBalanceHtml = ({
  balance, currency, threshold, userName, walletName, walletType,
}: LowBalanceData) => {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

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
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Low Balance Alert</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 6px;color:#64748b;font-size:14px;">Hi ${userName},</p>
            <h1 style="margin:0 0 24px;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
              Your ${walletName} balance is low
            </h1>

            <!-- Wallet details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:16px;">
                        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Wallet</p>
                        <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${walletName}</p>
                        <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">${walletType}</p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:50%;padding-right:12px;">
                              <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Current Balance</p>
                              <p style="margin:0;color:#ef4444;font-size:20px;font-weight:700;">${fmt(balance)}</p>
                            </td>
                            <td style="width:50%;">
                              <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Your Threshold</p>
                              <p style="margin:0;color:#0f172a;font-size:20px;font-weight:700;">${fmt(threshold)}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              Your balance has dropped below your ${fmt(threshold)} alert threshold.
              Consider topping up this account to avoid declined transactions.
              You can adjust or disable this alert in Cashlex under <strong>Wallets</strong>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Sent by <a href="#" style="color:#64748b;text-decoration:none;">Cashlex</a> · Low Balance Alerts
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
