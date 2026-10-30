export const loader = ({ params }: { params: { slug: string } }) => {
  if (params.slug !== 'hello') {
    throw new Response('Not Found', { status: 404 });
  }
  return { title: 'Hello world' };
};
