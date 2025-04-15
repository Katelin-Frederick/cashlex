import { relations, sql } from "drizzle-orm";
import {
  pgTableCreator,
  primaryKey,
  index,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `cashlex_${name}`);

export const users = createTable("user", (d) => ({
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d.uuid("userId").notNull().references(() => users.id),
    type: d.text("type").$type<"oauth">().notNull(),
    provider: d.text("provider").notNull(),
    providerAccountId: d.text("providerAccountId").notNull(),
    refresh_token: d.text("refresh_token"),
    access_token: d.text("access_token"),
    expires_at: d.timestamp("expires_at", { withTimezone: true }),
    token_type: d.text("token_type"),
    scope: d.text("scope"),
    id_token: d.text("id_token"),
    session_state: d.text("session_state"),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  })
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
