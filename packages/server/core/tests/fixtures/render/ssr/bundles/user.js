export function requestHandler() {
  return new Response('SSR User Render', {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  });
}
