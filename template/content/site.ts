// Site-wide copy. Pages read their text from content/, never from JSX literals.
export const site = {
  name: 'Atelier Nord',
  tagline: 'Furniture made slowly, to be kept for decades.',
  description:
    'Atelier Nord designs and builds solid-wood furniture in small batches, from one workshop, for homes that keep things.',
  url: 'https://example.com',
  locale: 'en',
  notFound: {
    title: 'This page has moved or never existed.',
    body: 'The workshop is still here. Start again from the home page.',
    cta: 'Back to the home page',
  },
} as const
