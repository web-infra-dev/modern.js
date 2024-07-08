import {
  createRequestHandler,
  HandleRequest,
  renderStreaming,
} from '@modern-js/runtime/ssr/server';

const handleRequest: HandleRequest = async (request, serverRoot, options) => {
  const stream = await renderStreaming(request, serverRoot, options);

  return new Response(stream, {
    headers: {
      'x-custom-key': '123',
    },
  });
};

export default createRequestHandler(handleRequest);
