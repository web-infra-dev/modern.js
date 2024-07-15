export function requestHandler() {
  // eslint-disable-next-line no-undef
  return new Response('SSR User Render', {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  });
}
