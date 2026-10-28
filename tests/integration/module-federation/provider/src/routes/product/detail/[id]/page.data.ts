export const loader = ({
  params,
  request,
}: {
  params: Record<string, string>;
  request: Request;
}) => {
  if (new URL(request.url).searchParams.has('fail'))
    throw new Error('Station loader unavailable');
  return { id: params.id };
};
