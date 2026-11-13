// Copy for the blog index. Articles live in content/blog/*.md (front matter: title, description, date, author).
export const blog = {
  meta: {
    title: '[Journal title: 50-60 characters, main topic first]',
    description: '[What readers learn here, 140-160 characters.]',
  },
  index: {
    title: '[Journal]',
    intro: '[One sentence on what you write about and how often.]',
    readMore: 'Read the article',
    back: 'All articles',
  },
} as const
