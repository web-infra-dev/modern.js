const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
  await wait(10);
  return {
    message: 'user layout',
  };
};
