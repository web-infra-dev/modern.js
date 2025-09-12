import {
  type HandleRequest,
  createRequestHandler,
  renderString,
} from '@modern-js/runtime/ssr/server';

const handleRequest: HandleRequest = async (request, ServerRoot, options) => {
  const body = await renderString(request, <ServerRoot />, options);
  const newBody = `<div id="server">custom entry-2-server</div>${body}`;
  return new Response(newBody, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
};

export default createRequestHandler(handleRequest);
