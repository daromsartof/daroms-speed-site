import 'server-only'
import { d1Db } from '@dss/data/d1'
import * as schema from './schema'

/** Drizzle on the D1 binding `DB`. Call inside a request (server component, action, route handler). */
export const db = () => d1Db(schema)
