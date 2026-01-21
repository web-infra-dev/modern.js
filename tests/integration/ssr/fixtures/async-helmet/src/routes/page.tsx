import { Helmet } from '@modern-js/runtime/head';

export default function Home() {
  return (
    <div>
      <Helmet>
        <title>Home Page - Async Helmet Test</title>
        <meta name="description" content="Home page for async helmet test" />
        <meta name="keywords" content="react,helmet,async,test" />
      </Helmet>
      <h1>Home Page</h1>
      <p>This is the home page with react-helmet-async integration.</p>
      <div id="home-content">Home content loaded</div>
    </div>
  );
}
