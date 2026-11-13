// Database schema (Drizzle, SQLite dialect: Cloudflare D1 and libSQL share it).
// After a change: pnpm db:generate, then pnpm db:migrate.
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { id, timestamps } from '@dss/data'

export const messages = sqliteTable('messages', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  body: text('body').notNull(),
  ...timestamps(),
})
