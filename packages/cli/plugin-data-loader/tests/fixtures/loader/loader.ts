const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loader = async ({ request }: { request: any }) => {
  // eslint-disable-next-line no-console
  console.log('request user layout', request.url);
  await wait(200);
  return {
    message: 'hello user',
  };
};

export default loader;
