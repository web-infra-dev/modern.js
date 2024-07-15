import {
  createRequestHandler,
  renderString,
} from '@modern-js/runtime/ssr/server';

const handleRequest = async (request, ServerRoot, options) => {
  const html = await renderString(request, <ServerRoot />, options);

  const newHtml = html.replace('</body>', '<div>Byte-Dance<div></body>');

  // eslint-disable-next-line no-undef
  return new Response(newHtml, {
    headers: {
      'x-custom-value': 'abc',
    },
  });
};

export default createRequestHandler(handleRequest);
