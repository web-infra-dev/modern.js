export const loader = () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/user/123',
      'Set-Cookie': 'tanstack_redirect=1; Path=/; HttpOnly',
      'X-Tanstack-Redirect': 'preserved',
    },
  });
};
