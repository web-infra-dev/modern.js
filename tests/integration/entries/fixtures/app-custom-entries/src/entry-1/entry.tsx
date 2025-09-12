import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';

const ModernRoot = createRoot();

async function beforeRender() {
  // todo
}

beforeRender().then(() => {
  render(
    <>
      <p id="wrapper">custom entry-1</p>
      <ModernRoot />
    </>,
  );
});
