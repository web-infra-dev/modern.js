export const ssgParams = () => [
  {},
  { category: undefined },
  { category: 'news' },
];
export const loader = ({ params }: { params: { category?: string } }) =>
  params.category || 'all';
