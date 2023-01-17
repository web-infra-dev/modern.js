```tsx title="src/App.tsx"
import { BrowserRouter, Route, Routes } from '@modern-js/runtime/router';
import { StaticRouter } from '@modern-js/runtime/router/server';
import React from 'react';
import { useRuntimeContext } from '@modern-js/runtime';

const Router = typeof window === 'undefined' ? StaticRouter : BrowserRouter;

export default () => {
  const { context } = useRuntimeContext();
  const pathname = context?.request?.pathname;
  return (
    <Router location={pathname}>
      <Routes>
        <Route index element={<div>index</div>} />
        <Route path="about" element={<div>about</div>} />
      </Routes>
    </Router>
  );
};
```
