import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

type Post = { language: string; slug: string; published: boolean };

// This module is shared by the loader and ssgParams, and must stay on the server.
export const getPublishedPosts = (): Post[] => {
  const posts: Post[] = JSON.parse(
    readFileSync(path.join(process.cwd(), 'params-src/posts.json'), 'utf8'),
  );
  return posts.filter(post => post.published);
};

export const generatePostParams = async () => {
  appendFileSync(process.env.SSG_PARAMS_CALLS!, 'SSG_PARAMS_SERVER_ONLY\n');
  if (process.env.SSG_PARAMS_SCENARIO === 'invalid') {
    return { slug: 'invalid' };
  }
  if (process.env.SSG_PARAMS_SCENARIO === 'throws') {
    throw new Error('CMS unavailable during ssgParams');
  }
  return getPublishedPosts().map(({ language, slug }) => ({ language, slug }));
};
