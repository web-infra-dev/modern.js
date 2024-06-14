import { createRoot } from '@modern-js/runtime/react';
import { render } from '@modern-js/runtime/client';
import {
  createProvider,
  isRenderGarfish,
} from '@modern-js/plugin-garfish/runtime';

if (!isRenderGarfish()) {
  const ModernRoot = createRoot();

  render(<ModernRoot />, 'root');
}

export const provider = createProvider();
