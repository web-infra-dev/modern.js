export const loader = async ({
  request,
}: {
  request: Request;
}) => {
  const user = new Promise(resolve =>
    setTimeout(() => resolve('user page data'), 1000),
  );

  return { user };
};
