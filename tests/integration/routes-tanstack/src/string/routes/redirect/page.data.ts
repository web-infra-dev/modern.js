export const loader = () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/user/123',
    },
  });
};

