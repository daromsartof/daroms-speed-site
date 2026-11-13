// Privacy policy (GDPR and Swiss nLPD). List only what the site really does; remove blocks that do not apply.
export const privacy = {
  meta: {
    title: 'Privacy policy',
    description: '[What personal data this site collects, why, for how long, and your rights.]',
  },
  legalText: {
    title: 'Privacy policy',
    updated: 'Last updated: [date]',
    blocks: [
      { heading: 'Controller', paragraphs: ['[Legal name, address, privacy contact email]'] },
      {
        heading: 'Data we collect',
        paragraphs: [
          '[Contact form: name, email, message. Server logs: IP address and request data, kept by the host for security.]',
        ],
      },
      {
        heading: 'Purposes and legal basis',
        paragraphs: [
          '[Answer your request (legitimate interest or pre-contractual steps); keep the site secure (legitimate interest).]',
        ],
      },
      {
        heading: 'Analytics',
        paragraphs: [
          '[Cookieless audience measurement with the provider, no personal profile; or: no analytics.]',
        ],
      },
      {
        heading: 'Processors and transfers',
        paragraphs: ['[Host, email provider, analytics provider; countries and safeguards.]'],
      },
      { heading: 'Retention', paragraphs: ['[How long each kind of data is kept.]'] },
      {
        heading: 'Your rights',
        paragraphs: [
          '[Access, rectification, erasure, objection, portability; how to exercise them; supervisory authority (e.g. FDPIC in Switzerland, your national authority in the EU).]',
        ],
      },
      { heading: 'Cookies', paragraphs: ['[This site sets no tracking cookies.]'] },
    ],
  },
} as const
