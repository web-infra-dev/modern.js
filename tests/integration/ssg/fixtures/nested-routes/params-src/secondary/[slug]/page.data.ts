export const ssgParams = () => [{ slug: 'start' }];

export const loader = ({ params }: { params: { slug: string } }) =>
  `Secondary: ${params.slug}`;
