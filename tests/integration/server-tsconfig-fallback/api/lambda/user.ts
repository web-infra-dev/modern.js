import hello from '@api/hello';

export default async () => {
  const { message } = await hello();
  return { user: 'modern', message };
};
