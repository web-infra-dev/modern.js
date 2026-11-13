import { Helmet } from '@modern-js/runtime/head';
import { useLoaderData } from '@modern-js/runtime/router';
import { imageSize } from '@shared/posts';
import type { loader } from './page.data';

export default function Article() {
  const { post, canonicalUrl, imageUrl } = useLoaderData() as ReturnType<
    typeof loader
  >;

  return (
    <article>
      <Helmet>
        <html lang="en" />
        <title>{post.title} | Modern.js Journal</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Modern.js Journal" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content={String(imageSize.width)} />
        <meta property="og:image:height" content={String(imageSize.height)} />
        <meta
          property="og:image:alt"
          content={`${post.title} — ${post.author}`}
        />
        <meta name="author" content={post.author} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>
      <p className="eyebrow">{post.category}</p>
      <h1>{post.title}</h1>
      <p className="byline">
        {post.author} · {post.date}
      </p>
      <p className="intro">{post.description}</p>
      <img
        className="cover"
        src={imageUrl}
        alt={`${post.title} — ${post.author}`}
        {...imageSize}
      />
      <div className="article-body">
        <p>
          A good story begins before someone opens the page. Its title,
          description and cover offer a first glimpse of what is inside.
        </p>
        <p>
          This article carries those details with it, ready for a conversation,
          a bookmark or the next idea it inspires.
        </p>
        <a href={imageUrl}>View this article's share image</a>
      </div>
    </article>
  );
}
