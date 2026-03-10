import nodemailer from 'nodemailer'

import { env, } from '~/env'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

type SendMailOptions = {
  html: string
  subject: string
  to: string
}

export const sendMail = async ({ html, subject, to, }: SendMailOptions) => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    html,
    subject,
    to,
  })
}
