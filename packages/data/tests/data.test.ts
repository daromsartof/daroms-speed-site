import { eq } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'
import { dssDrizzleConfig } from '../src/drizzle-config.ts'
import { id, timestamps } from '../src/index.ts'
import { libsqlDb } from '../src/libsql-client.ts'

const messages = sqliteTable('messages', {
  id: id(),
  email: text('email').notNull(),
  ...timestamps(),
})

describe('libsqlDb', () => {
  it('runs typed queries with default ids and timestamps', async () => {
    const db = libsqlDb({ messages }, { url: ':memory:' })
    await db.run(
      'create table messages (id text primary key, email text not null, created_at integer not null, updated_at integer not null)',
    )
    const [row] = await db.insert(messages).values({ email: 'a@b.co' }).returning()
    expect(row?.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(row?.createdAt).toBeInstanceOf(Date)
    const found = await db.select().from(messages).where(eq(messages.email, 'a@b.co'))
    expect(found).toHaveLength(1)
  })

  it('requires a url', () => {
    const previous = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => libsqlDb({ messages })).toThrow(/DATABASE_URL/)
    if (previous) process.env.DATABASE_URL = previous
  })
})

describe('dssDrizzleConfig', () => {
  it('needs no credentials to generate D1 migrations', () => {
    expect(dssDrizzleConfig({ db: { driver: 'd1' } }, { env: {} })).toMatchObject({
      dialect: 'sqlite',
      out: './server/db/migrations',
    })
  })

  it('names missing credentials for remote D1 without printing values', () => {
    expect(() =>
      dssDrizzleConfig(
        { db: { driver: 'd1' } },
        { env: { CLOUDFLARE_ACCOUNT_ID: 'x' }, remote: true },
      ),
    ).toThrow(/CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_D1_TOKEN/)
  })

  it('maps libsql and refuses driver none', () => {
    expect(dssDrizzleConfig({ db: { driver: 'libsql' } }, { env: {} }).dialect).toBe('turso')
    expect(() => dssDrizzleConfig({ db: { driver: 'none' } })).toThrow(/dss db init/)
  })
})

describe('postgres', () => {
  it('requires a url without connecting', async () => {
    const { postgresDb } = await import('../src/postgres-client.ts')
    const previous = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => postgresDb({})).toThrow(/DATABASE_URL/)
    if (previous) process.env.DATABASE_URL = previous
  })

  it('builds pg columns', async () => {
    const { pgTable, text } = await import('drizzle-orm/pg-core')
    const { id, timestamps } = await import('../src/pg-columns.ts')
    const table = pgTable('t', { id: id(), name: text('name'), ...timestamps() })
    expect(Object.keys(table)).toEqual(
      expect.arrayContaining(['id', 'name', 'createdAt', 'updatedAt']),
    )
  })
})
