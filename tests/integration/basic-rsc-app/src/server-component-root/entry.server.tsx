import { RSCServerSlot } from '@modern-js/render/client';
import { createRoot } from '@modern-js/runtime/react';
import {
  createRequestHandler,
  renderStreaming,
} from '@modern-js/runtime/ssr/server';

const handleRequest = async (request, ServerRoot, options) => {
  const body = await renderStreaming(
    request,
    <ServerRoot>
      <RSCServerSlot />
    </ServerRoot>,
    {
      ...options,
      rscRoot: <options.rscRoot />,
    },
  );

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'transfer-encoding': 'chunked',
    },
  });
};

const requestHandler = createRequestHandler(handleRequest, {
  enableRsc: true,
});

export default requestHandler;
