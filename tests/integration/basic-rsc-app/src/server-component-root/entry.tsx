import '@modern-js/runtime/registry/server-component-root';
import {
  RscClientRoot,
  createFromReadableStream,
  rscStream,
} from '@modern-js/render/client';
import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';

const ModernRoot = createRoot();

const data = createFromReadableStream(rscStream);

render(
  <ModernRoot>
    <RscClientRoot data={data} />
  </ModernRoot>,
  'root',
);
