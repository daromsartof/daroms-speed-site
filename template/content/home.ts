import type { Route } from 'next'

// Copy for the home page. Edit text here; sections receive it as props.
export const home = {
  meta: {
    title: 'Solid-wood furniture made in small batches',
    description:
      'Tables and chairs cut, joined and finished by three people in one workshop. Forty tables a year, every one repairable.',
  },
  hero: {
    eyebrow: 'Small-batch furniture',
    title: 'Built to outlast the house it lives in.',
    body: 'Every piece is cut, joined and finished by the same three people. We make forty tables a year and repair every one we have ever sold.',
    primary: { label: 'See the current batch', href: '/#batch' as Route },
    secondary: { label: 'How we work', href: '/#process' as Route },
  },
} as const
