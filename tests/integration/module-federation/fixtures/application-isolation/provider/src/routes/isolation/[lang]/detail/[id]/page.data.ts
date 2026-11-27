export const loader = ({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) => ({
  source: 'producer detail',
  id: params.id,
  probe: new URL(request.url).searchParams.get('probe'),
});
