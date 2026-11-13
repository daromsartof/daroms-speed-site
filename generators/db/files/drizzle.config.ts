import { dssDrizzleConfig } from '@dss/data/config'
import manifest from './site.manifest.ts'

// Generating migrations needs no credentials; remote migrate/studio read them from the environment.
export default dssDrizzleConfig(manifest, { remote: process.env.DSS_DB_REMOTE === '1' })
