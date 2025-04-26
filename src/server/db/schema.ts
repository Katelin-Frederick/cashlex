import {
  pgTableCreator,
  primaryKey,
  decimal,
  index,
  uuid,
  text,
} from 'drizzle-orm/pg-core'
import { relations, } from 'drizzle-orm'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `cashlex_${name}`)

export const users = createTable('user', () => ({
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username', { nullable: true, }).unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
}))

export const accounts = createTable(
  'account',
  (d) => ({
    userId: d.uuid('userId').notNull().references(() => users.id),
    type: d.text('type').$type<'oauth'>().notNull(),
    provider: d.text('provider').notNull(),
    providerAccountId: d.text('providerAccountId').notNull(),
    refresh_token: d.text('refresh_token'),
    access_token: d.text('access_token'),
    expires_at: d.bigint('expires_at', { mode: 'number', }),
    token_type: d.text('token_type'),
    scope: d.text('scope'),
    id_token: d.text('id_token'),
    session_state: d.text('session_state'),
  }),
  (table) => ({ pk: primaryKey({ columns: [table.provider, table.providerAccountId], }), })
)

export const sessions = createTable(
  'session',
  (d) => ({
    sessionToken: d.varchar({ length: 255, }).notNull().primaryKey(),
    userId: uuid('userId').notNull().references(() => users.id),
    expires: d.timestamp({ mode: 'date', withTimezone: true, }).notNull(),
  }),
  (t) => [index('t_user_id_idx').on(t.userId)]
)

export const budgets = createTable('budget', (d) => ({
  id: d.uuid('id').primaryKey().defaultRandom(),
  userId: d.uuid('userId').notNull().references(() => users.id),
  name: d.text('name').notNull(),
  description: d.text('description'),
  amount: decimal('amount', { precision: 10, scale: 2, }).notNull().$type<number>(),
  spent: decimal('spent', { precision: 10, scale: 2, }).notNull().default('0').$type<number>(),
  createdAt: d.timestamp('created_at', { mode: 'date', withTimezone: false, }).defaultNow(),
}))

export const transactions = createTable('transaction', (d) => ({
  id: d.uuid('id').primaryKey().defaultRandom(),
  userId: d.uuid('userId').notNull().references(() => users.id),
  paymentName: d.text('payment_name').notNull(),
  paymentType: d.text('payment_type').notNull().$type<'income' | 'expense'>(),
  amount: decimal('amount', { precision: 10, scale: 2, }).notNull().$type<number>(),
  paidDate: d.timestamp('paid_date', { mode: 'date', withTimezone: false, }).notNull(),
  budgetId: d.uuid('budgetId').references(() => budgets.id),  // No need for `.nullable()`
  category: d.text('category'),  // Automatically nullable by default
  createdAt: d.timestamp('created_at', { mode: 'date', withTimezone: false, }).defaultNow(),
}))

// Correct relations definition
export const transactionsRelations = relations(
  transactions,
  ({ one, many, }) => ({
    user: one(users, { fields: [transactions.userId], references: [users.id], }),
    budget: one(budgets, { fields: [transactions.budgetId], references: [budgets.id], nullable: true, }),  // Explicitly handle nullable
  })
)

export const sessionsRelations = relations(
  sessions,
  ({ one, }) => ({ user: one(users, { fields: [sessions.userId], references: [users.id], }), })
)

export const verificationTokens = createTable(
  'verification_token',
  (d) => ({
    identifier: d.varchar({ length: 255, }).notNull(),
    token: d.varchar({ length: 255, }).notNull(),
    expires: d.timestamp({ mode: 'date', withTimezone: true, }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token], })]
)
