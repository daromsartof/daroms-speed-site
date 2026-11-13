const IDENT = /^[A-Za-z_$][\w$]*$/

/** Readable TypeScript literal: bare keys, single-quoted strings. Ported from daroms-speed-app. */
export function toTs(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent + 1)
  const end = '  '.repeat(indent)
  if (typeof value === 'string')
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
  if (typeof value === 'number')
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
  if (typeof value !== 'object' || value === null) return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const flat = value.every((v) => typeof v !== 'object' || v === null)
    const inline = `[${value.map((v) => toTs(v)).join(', ')}]`
    if (flat && inline.length + indent * 2 < 90) return inline
    return `[\n${value.map((v) => `${pad}${toTs(v, indent + 1)},`).join('\n')}\n${end}]`
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return '{}'
  const body = entries.map(
    ([k, v]) => `${pad}${IDENT.test(k) ? k : `'${k}'`}: ${toTs(v, indent + 1)},`,
  )
  return `{\n${body.join('\n')}\n${end}}`
}
