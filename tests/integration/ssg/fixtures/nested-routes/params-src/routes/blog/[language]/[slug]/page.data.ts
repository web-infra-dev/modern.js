import { generatePostParams, getPublishedPosts } from '@posts';

export const ssgParams = generatePostParams;

export const loader = ({
  params,
  request,
}: {
  params: { language: string; slug: string };
  request: Request;
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
  const variant = request.headers.get('x-ssg-variant');
  return variant
    ? `${post.language}: ${post.slug} (${variant})`
    : `${post.language}: ${post.slug}`;
};
