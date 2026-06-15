import {
  type HandleRequest,
  createRequestHandler,
  renderStreaming,
} from '@modern-js/runtime/ssr/server';

const handleRequest: HandleRequest = async (request, ServerRoot, options) => {
  const stream = await renderStreaming(request, <ServerRoot />, options);

  return new Response(stream, {
    headers: {
      'x-custom-key': '123',
    },
  });
};

export default createRequestHandler(handleRequest);
