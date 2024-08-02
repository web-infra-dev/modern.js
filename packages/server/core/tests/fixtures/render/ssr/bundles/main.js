export function requestHandler() {
  return new Response('SSR Render', {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  });
}
