import { buildGraph, type JsonLdNode } from './jsonld.ts'

/**
 * Renders a JSON-LD graph in the server HTML. `buildGraph` escapes `<`, so the payload cannot
 * break out of the script tag. The only sanctioned use of dangerouslySetInnerHTML in a site.
 */
export function JsonLd({ nodes }: { nodes: readonly (JsonLdNode | undefined)[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildGraph(nodes) }} />
  )
}
