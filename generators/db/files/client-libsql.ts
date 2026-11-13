import 'server-only'
import { libsqlDb } from '@dss/data/libsql'
import * as schema from './schema'

/** Drizzle on libSQL (local file, Turso). DATABASE_URL and DATABASE_AUTH_TOKEN come from the environment. */
export const db = () => libsqlDb(schema)
