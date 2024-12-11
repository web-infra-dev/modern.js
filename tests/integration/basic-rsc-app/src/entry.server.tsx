import { ServerSlot } from '@modern-js/render/client';
import { createRoot } from '@modern-js/runtime/react';
import {
  createRequestHandler,
  renderStreaming,
} from '@modern-js/runtime/ssr/server';
import type { ReactNode } from 'react';
import Root from './Root';

const handleRequest = async (request, ServerRoot, options) => {
  const DefaultRoot = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  const ModernRoot = createRoot(DefaultRoot);
  const body = await renderStreaming(
    request,
    <ModernRoot>
      <ServerSlot />
    </ModernRoot>,
    {
      ...options,
      rscRoot: <Root />,
    },
  );

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'transfer-encoding': 'chunked',
    },
  });
};

const requestHandler = createRequestHandler(handleRequest);

export default requestHandler;
