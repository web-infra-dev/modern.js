import { createRoot } from '@modern-js/runtime/react';
import { render } from '@modern-js/runtime/browser';
import {
  createProvider,
  isRenderGarfish,
} from '@modern-js/plugin-garfish/tools';

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
