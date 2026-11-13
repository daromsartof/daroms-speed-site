// Legal notice. Facts come from site.spec.md > Legal; unknown facts stay in [brackets] and go to Open facts.
export const legal = {
  meta: {
    title: 'Legal notice',
    description: '[Who publishes this site: owner, address, registration and host.]',
  },
  legalText: {
    title: 'Legal notice',
    updated: 'Last updated: [date]',
    blocks: [
      {
        heading: 'Publisher',
        paragraphs: [
          '[Legal name and legal form]',
          '[Street, postal code, city, country]',
          '[Registration number, VAT number]',
        ],
      },
      { heading: 'Contact', paragraphs: ['[Email]', '[Telephone]'] },
      { heading: 'Person responsible for content', paragraphs: ['[Full name, role]'] },
      {
        heading: 'Hosting',
        paragraphs: [
          '[Host name and address, e.g. Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA]',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: ['[Who owns the texts, photos and brand; reuse conditions]'],
      },
    ],
  },
} as const
