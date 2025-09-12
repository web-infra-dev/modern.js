import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';

const ModernRoot = createRoot();

render(
  <>
    <p id="wrapper">custom entry-2</p>
    <ModernRoot />
  </>,
);
