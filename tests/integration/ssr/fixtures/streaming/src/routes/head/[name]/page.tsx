import { Helmet } from '@modern-js/runtime/head';
import { Await, Link, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export default function Page() {
  const { name, ready } = useLoaderData() as {
    name: string;
    ready?: Promise<string>;
  };
  return (
    <>
      <Helmet
        htmlAttributes={{ lang: name }}
        bodyAttributes={{ 'data-head-page': name }}
      >
        <title>{`Head ${name}`}</title>
        <meta name="description" content={`Description ${name}`} />
        <link rel="canonical" href={`https://example.com/${name}`} />
        <script type="application/ld+json">{JSON.stringify({ name })}</script>
      </Helmet>
      <h1>{`Head ${name}`}</h1>
      <Link id="head-next" to="/head/fr">
        French page
      </Link>
      {ready && (
        <Suspense fallback={<p>Loading details</p>}>
          <Await resolve={ready}>{value => <p>{String(value)}</p>}</Await>
        </Suspense>
      )}
    </>
  );
}
