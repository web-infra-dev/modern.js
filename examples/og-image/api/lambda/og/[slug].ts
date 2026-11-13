import { renderOgImage } from '../../../shared/og/render';
import { getPost } from '../../../shared/posts';

export default async (slug: string) => {
  const post = getPost(slug);
  if (!post) {
    return new Response('Article not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const png = await renderOgImage(post);
  // A standard Response bypasses BFF's default JSON serialization.
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
