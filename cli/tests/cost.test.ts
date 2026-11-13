import { describe, expect, it } from 'vitest'
import { money, renderReport, summarize, tokens } from '../lib/cost-report.ts'
import { normalizeModel, priceOf, type Usage } from '../lib/pricing.ts'
import { parseSession } from '../lib/transcripts.ts'

const usage = (u: Partial<Usage>): Usage => ({
  input: 0,
  output: 0,
  read: 0,
  write5m: 0,
  write1h: 0,
  webSearches: 0,
  fast: false,
  usGeo: false,
  ...u,
})
const M = 1_000_000

describe('pricing', () => {
  it('prices each token category', () => {
    expect(
      priceOf('claude-opus-5-5', usage({ input: M, output: M, read: M, write5m: M, write1h: M })),
    ).toBeCloseTo(4 + 20 + 0.2 + 5 + 8)
    expect(priceOf('claude-sonnet-5-5', usage({ read: M }))).toBeCloseTo(0.1)
    expect(priceOf('claude-haiku-4-5-20251001', usage({ output: M }))).toBeCloseTo(5)
  })

  it('matches the exact model before its prefix', () => {
    expect(priceOf('claude-opus-5', usage({ input: M }))).toBeCloseTo(5)
    expect(normalizeModel('us.anthropic.claude-opus-5-5[1m]')).toBe('claude-opus-5-5')
    expect(priceOf('gpt-5', usage({ input: M }))).toBeUndefined()
  })

  it('applies fast mode, US inference, the long Haiku 5.5 tier and web searches', () => {
    expect(priceOf('claude-opus-5-5', usage({ input: M, fast: true }))).toBeCloseTo(8)
    expect(priceOf('claude-opus-5-5', usage({ input: M, usGeo: true }))).toBeCloseTo(4.4)
    expect(priceOf('claude-haiku-5-5', usage({ input: 50_000, read: 60_000 }))).toBeCloseTo(
      0.025 + 0.003,
    )
    expect(priceOf('claude-sonnet-5-5', usage({ webSearches: 3 }))).toBeCloseTo(0.03)
  })
})

const line = (entry: object) => JSON.stringify(entry)
const reply = (id: string, at: string, content: unknown[] = [], cwd = '/sites/kora') =>
  line({
    type: 'assistant',
    timestamp: at,
    cwd,
    message: {
      id,
      model: 'claude-opus-5-5',
      content,
      usage: {
        input_tokens: 0,
        output_tokens: M,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  })
const skill = (name: string) => [{ type: 'tool_use', name: 'Skill', input: { skill: name } }]

describe('transcripts', () => {
  const main = [
    line({
      type: 'user',
      timestamp: '2026-11-13T10:00:00Z',
      cwd: '/sites/other',
      message: { content: '<command-name>/dss-site</command-name>' },
    }),
    reply('m1', '2026-11-13T10:00:01Z', skill('dss-brief'), '/sites/other'),
    reply('m1', '2026-11-13T10:00:01Z', skill('dss-brief'), '/sites/other'),
    reply('m2', '2026-11-13T10:01:00Z', [
      { type: 'tool_use', name: 'Bash', input: { command: 'pnpm dss new kora --preset vitrine' } },
    ]),
    reply('m3', '2026-11-13T10:02:00Z', skill('dss-design-system')),
    reply('m4', '2026-11-13T10:03:00Z', skill('dss-polish')),
    reply('m5', '2026-11-13T11:00:00Z'),
  ].join('\n')
  // a1 runs during scaffolding (before dss-polish at 10:03), a2 during the polish
  const agent = [reply('a1', '2026-11-13T10:02:30Z'), reply('a2', '2026-11-13T11:30:00Z')].join(
    '\n',
  )
  const session = parseSession('s1', main, [{ text: agent, agent: 'dss-critic' }], '/sites/kora')

  it('assigns each answer to the current step, ignoring helper skills', () => {
    expect(session.turns.map((t) => `${t.id}:${t.step}`)).toEqual([
      'm1:dss-site',
      'm2:dss-brief',
      'm3:dss-new',
      'm4:dss-new',
      'm5:dss-polish',
      'a1:dss-new',
      'a2:dss-polish',
    ])
    expect(session.share).toBeCloseTo(4 / 7)
  })

  it('counts every answer once', () => {
    const summary = summarize([session, session])
    expect(summary.total.turns).toBe(7)
    expect(summary.total.agentTurns).toBe(2)
    expect(summary.total.cost).toBeCloseTo(7 * 20)
  })

  it('detects headless slash commands', () => {
    const headless = parseSession(
      's2',
      [
        line({
          type: 'user',
          timestamp: '2026-11-13T12:00:00Z',
          cwd: '/sites/kora',
          message: { content: '/dss-copy home' },
        }),
        reply('h1', '2026-11-13T12:00:05Z'),
      ].join('\n'),
      [],
      '/sites/kora',
    )
    expect(headless.turns.map((t) => t.step)).toEqual(['dss-copy'])
  })

  it('writes the report in English', () => {
    const report = renderReport('Kora', summarize([session]), new Date('2026-11-13T18:00:00Z'))
    expect(report).toContain('# Cost of Kora')
    expect(report).toContain('| **$140.00** | 7.0M | 7 (2 from subagents) | 1 | 1h00 |')
    expect(report).toContain('| `dss-new` | 3 | 0 | 3.0M | 0 | 0 | $60.00 | 43% |')
    expect(report).toContain('Most expensive step: `dss-new`')
    expect(money(1234.5)).toBe('$1,234.50')
    expect(money(0.001)).toBe('< $0.01')
    expect(report).toContain('## Key points')
    expect(tokens(559_283)).toBe('559k')
  })
})
