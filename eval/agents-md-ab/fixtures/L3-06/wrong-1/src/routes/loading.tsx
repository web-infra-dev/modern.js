import React, { Suspense } from 'react';

const LazyBlog = React.lazy(() => import('./blog/page'));

const Loading = () => (
  <Suspense fallback={<div>route-loading</div>}>
    <LazyBlog />
  </Suspense>
);

export default Loading;
