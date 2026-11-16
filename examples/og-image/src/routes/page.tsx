import { Helmet } from '@modern-js/runtime/head';
import { Link } from '@modern-js/runtime/router';
import { posts } from '@shared/posts';

export default function Index() {
  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Modern.js Journal</title>
        <meta
          name="description"
          content="Thoughtful stories with beautiful share images."
        />
      </Helmet>
      <p className="eyebrow">THE JOURNAL</p>
      <h1>
        Every story starts
        <br />
        with an idea.
      </h1>
      <p className="intro">Thoughtful stories with a cover worth sharing.</p>
      <div className="post-list">
        {posts.map(post => (
          <article key={post.slug}>
            <p className="eyebrow">{post.category}</p>
            <h2>
              <Link to={`/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            <p>{post.description}</p>
            <p className="byline">
              {post.author} · {post.date}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
