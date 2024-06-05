import { createRoot } from '@modern-js/runtime-v2/react';
import { render } from '@modern-js/runtime-v2/client';
import {
  createProvider,
  isRenderGarfish,
} from '@modern-js/plugin-garfish-v2/runtime';

if (!isRenderGarfish()) {
  const ModernRoot = createRoot();

  render(<ModernRoot />, 'root');
}

export const provider = createProvider();
