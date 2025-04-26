import { z, } from 'zod'

export const transactionSchema = z.object({
  paymentName: z.string().min(2, { message: 'Payment Name must be at least 2 characters.', }),
  paymentType: z.string().min(1, { message: 'Payment Type is required.', }),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.', })
    .refine((val) => parseFloat(val) > 0, { message: 'Amount must be positive.', }),
  paidDate: z.date({ required_error: 'Paid Date is required.', }),
  budget: z.string().optional().nullable(),
  category: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
