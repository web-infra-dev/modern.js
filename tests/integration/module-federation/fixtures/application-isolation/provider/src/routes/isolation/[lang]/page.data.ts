export const loader = ({ request }: { request: Request }) => ({
  source: 'producer',
  probe: new URL(request.url).searchParams.get('probe'),
});
