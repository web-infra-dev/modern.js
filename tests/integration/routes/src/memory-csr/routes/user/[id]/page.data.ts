export const loader = ({
  params,
  request,
}: {
  params: Record<string, string>;
  request: Request;
}) => {
  const url = new URL(request.url);
  return {
    id: params.id,
    tab: url.searchParams.get('tab') || 'default',
  };
};
