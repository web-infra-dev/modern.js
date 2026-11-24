export const loader = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const target = url.searchParams.get('target') || '42';
  const tab = url.searchParams.get('tab') || 'landed';
  const probe = url.searchParams.get('probe') || 'redirected';
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/detail/${target}?tab=${tab}&probe=${probe}`,
    },
  });
};
