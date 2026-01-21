import { Helmet } from '@modern-js/runtime/head';
import { useLoaderData } from '@modern-js/runtime/router';

export default function About() {
  const { message } = useLoaderData() as { message: string };

  return (
    <div>
      <Helmet>
        <title>About - Async Helmet Test</title>
        <meta name="description" content="About page for async helmet test" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About Us" />
        <meta property="og:url" content="http://localhost/about" />
      </Helmet>
      <h1>About Page</h1>
      <p>{message}</p>
      <div id="about-content">About content loaded</div>
    </div>
  );
}

export async function loader() {
  return {
    message: 'This is the about page with react-helmet-async',
  };
}
