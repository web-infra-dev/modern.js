import {
  createProvider,
  isRenderGarfish,
} from '@modern-js/plugin-garfish/tools';
import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';

async function beforeRender() {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

if (!isRenderGarfish()) {
  const ModernRoot = createRoot();
  beforeRender().then(() => {
    render(<ModernRoot />, 'root');
  });
}

export const provider = createProvider('root', { beforeRender });
