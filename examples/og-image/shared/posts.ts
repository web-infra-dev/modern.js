export type Post = {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
};

export const posts: Post[] = [
  {
    slug: 'hello-modern',
    title: 'Good ideas deserve a great first impression.',
    description:
      'Give every article its own share image with Modern.js, Satori and Resvg.',
    author: 'Alex Morgan',
    date: '2026-11-13',
    category: 'BUILDING FOR THE WEB',
  },
  {
    slug: 'long-title',
    title:
      'A practical guide to building thoughtful web experiences with server-rendered pages, meaningful metadata, and beautiful share images that travel with every story you publish',
    description:
      'A longer title exercises the cover layout. The full title stays in the page and its metadata.',
    author: 'Sam Rivera',
    date: '2026-11-12',
    category: 'DESIGN & ENGINEERING',
  },
];

export const getPost = (slug: string | undefined) =>
  posts.find(post => post.slug === slug);

export const imageSize = { width: 1200, height: 630 };

// Used only by the BFF variant. Build-time images use a hash of the PNG bytes.
// Increment this when BFF image content, the template or fonts change.
export const imageVersion = '1';

export const getBffImagePath = (slug: string) =>
  `/api/og/${encodeURIComponent(slug)}?v=${imageVersion}`;
