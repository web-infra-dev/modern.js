export function requestHandler(request) {
  if (request.headers.get('x-render-error')) {
    throw new Error('custom render error');
  }
  return new Response('SSR Render', {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  });
}
