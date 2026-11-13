import 'server-only'
import { postgresDb } from '@dss/data/postgres'
import * as schema from './schema'

/** Drizzle on Postgres. DATABASE_URL comes from the environment. */
export const db = () => postgresDb(schema)
