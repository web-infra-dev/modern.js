import '@modern-js/runtime/registry/client-component-root';
import {
  RscClientRoot,
  createFromReadableStream,
  rscStream,
} from '@modern-js/render/client';
import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { Fragment } from 'react/jsx-runtime';

const DefaultRoot = ({ children }: { children?: ReactNode }) =>
  createElement(Fragment, null, children);
const ModernRoot = createRoot(DefaultRoot);

const data = createFromReadableStream(rscStream);

render(
  <ModernRoot>
    <RscClientRoot data={data} />
  </ModernRoot>,
  'root',
);
