// Site-wide copy. Pages read their text from content/, never from JSX literals.
export const site = {
  tagline: 'Furniture made slowly, to be kept for decades.',
  description:
    'Atelier Nord designs and builds solid-wood furniture in small batches, from one workshop, for homes that keep things.',
  notFound: {
    title: 'This page has moved or never existed.',
    body: 'The workshop is still here. Start again from the home page.',
    cta: 'Back to the home page',
  },
  llms: {
    summary:
      'Atelier Nord is a small furniture workshop making solid-wood tables and chairs in small batches.',
  },
} as const
