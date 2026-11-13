import { generatePostParams, getPublishedPosts } from '@posts';

export const ssgParams = generatePostParams;

export const loader = ({
  params,
}: {
  params: { language: string; slug: string };
}) => {
  if (params.slug === 'explicit') {
    return 'Explicit route';
  }
  const post = getPublishedPosts().find(
    item => item.language === params.language && item.slug === params.slug,
  );
  if (!post) {
    throw new Response('Not Found', { status: 404 });
  }
  return `${post.language}: ${post.slug}`;
};
