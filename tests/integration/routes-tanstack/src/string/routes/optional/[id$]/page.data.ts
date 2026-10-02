export const loader = ({
  params,
}: {
  params: Record<string, string | undefined>;
}) => {
  return {
    id: params.id ?? 'none',
  };
};
