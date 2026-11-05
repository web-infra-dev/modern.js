export const loader = ({ params }: { params: { id: string } }) => ({
  source: 'host detail',
  id: params.id,
});
