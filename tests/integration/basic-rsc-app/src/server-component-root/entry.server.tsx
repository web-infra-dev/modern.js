import { RSCServerSlot } from '@modern-js/render/client';
import { handleAction as _handleAction } from '@modern-js/runtime/rsc/server';
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

export const handleAction = _handleAction;
