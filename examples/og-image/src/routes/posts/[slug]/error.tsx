import { Helmet } from '@modern-js/runtime/head';
import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from '@modern-js/runtime/router';

export default function ArticleError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? 'Article not found' : 'Unable to load this article';
  return (
    <>
      <Helmet>
        <title>{title} | Modern.js Journal</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1>{title}</h1>
      <p>
        <Link to="/">Back to the journal</Link>
      </p>
    </>
  );
}
