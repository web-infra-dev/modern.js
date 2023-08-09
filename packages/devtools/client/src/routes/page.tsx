import './index.css';
import { Helmet } from '@modern-js/runtime/head';
import { Suspense } from 'react';
import { Foo } from './foo';

const Index = () => (
  <div className="container-box">
    <Helmet>
      <link
        rel="icon"
        type="image/x-icon"
        href="https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/favicon.ico"
      />
    </Helmet>
    <main>
      <div className="title">Hello DevTools!</div>
      <Suspense fallback={<div>loading...</div>}>
        <Foo />
      </Suspense>
    </main>
  </div>
);

export default Index;
