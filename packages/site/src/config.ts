// Node-safe entry (no JSX, explicit .ts imports): imported by next.config.ts, site.manifest.ts and the CLI.
export {
  defineManifest,
  MANIFEST_INPUT,
  ManifestSchema,
  PageSchema,
  OrganizationSchema,
  type Manifest,
  type ManifestInput,
  type Page,
} from './manifest.ts'
export { withDss, type WithDssOptions } from './next-config.ts'
