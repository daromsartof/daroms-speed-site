// Database schema (Drizzle, Postgres dialect). After a change: pnpm db:generate, then pnpm db:migrate.
import { pgTable, text } from 'drizzle-orm/pg-core'
import { id, timestamps } from '@dss/data/pg'

export const messages = pgTable('messages', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  body: text('body').notNull(),
  ...timestamps(),
})
