import type { LoaderFunctionArgs } from '@modern-js/runtime/router';
import { getPost } from '@shared/posts';

export const loader = ({ params }: LoaderFunctionArgs) => {
  const post = getPost(params.slug);
  if (!post) {
    throw new Response('Article not found', { status: 404 });
  }

  return {
    post,
    canonicalUrl: new URL(`/posts/${post.slug}`, process.env.SITE_URL).href,
    imageUrl: new URL(__OG_IMAGE_PATHS__[post.slug], process.env.SITE_URL).href,
  };
};
