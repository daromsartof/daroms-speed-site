// Site-wide copy. Pages read their text from content/, never from JSX literals.
// `nav` labels are keyed by route and kept in sync by `dss g page`.
export const site = {
  tagline: '[Short tagline: what you do, for whom]',
  description: '[One or two sentences for search results and social cards, 140-160 characters.]',
  nav: { '/': 'Home' } as Record<string, string>,
  header: { cta: { label: '[Contact]', href: '/contact' }, menu: 'Menu', skip: 'Skip to content' },
  footer: {
    legal: '[Legal name or owner]',
    note: '[One line: location, registration number or a sign-off]',
    // Studio credit: keep it on every site (dss doctor --strict checks it).
    credit: { label: "Site by Daroms'Art", href: 'https://daromsart.xyz/' },
  },
  notFound: {
    title: 'This page has moved or never existed.',
    body: 'Start again from the home page.',
    cta: 'Back to the home page',
  },
  llms: { summary: '[One factual sentence describing the business for answer engines.]' },
} as const
