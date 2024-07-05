export function requestHandler() {
  // eslint-disable-next-line no-undef
  return new Response('SSR Render', {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  });
}
