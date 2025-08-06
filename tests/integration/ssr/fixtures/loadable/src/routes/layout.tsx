import loadable from '@modern-js/runtime/loadable';
import React from 'react';

const MyComponent = loadable(() => import('../components/MyComponent'), {});

const Page = () => {
  return (
    <div>
      <h1>Loadable Test</h1>
      <MyComponent />
    </div>
  );
};

export default Page;
