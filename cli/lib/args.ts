// Minimal argv parsing: positionals, --key value, --key=value, --flag. Ported from daroms-speed-app.
export type Args = { _: string[]; flags: Record<string, string | boolean> }

export function parseArgs(argv: readonly string[]): Args {
  const out: Args = { _: [], flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string
    if (!arg.startsWith('--')) {
      out._.push(arg)
      continue
    }
    const [key, inline] = arg.slice(2).split('=', 2) as [string, string | undefined]
    const next = argv[i + 1]
    if (inline !== undefined) out.flags[key] = inline
    else if (next !== undefined && !next.startsWith('--')) {
      out.flags[key] = next
      i++
    } else out.flags[key] = true
  }
  return out
}

export function flag(args: Args, name: string): string | undefined {
  const value = args.flags[name]
  return typeof value === 'string' ? value : undefined
}

export function bool(args: Args, name: string): boolean {
  return args.flags[name] === true || args.flags[name] === 'true'
}

export function list(args: Args, name: string): string[] {
  return (flag(args, name) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
