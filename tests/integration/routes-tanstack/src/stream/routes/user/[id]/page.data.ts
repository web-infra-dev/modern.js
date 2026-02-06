export const loader = ({ params }: { params: Record<string, string> }) => {
  return {
    id: params.id,
  };
};

