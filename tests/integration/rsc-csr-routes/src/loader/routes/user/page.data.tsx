export const loader = async (_args: { request: Request }) => {
  const user = new Promise(resolve =>
    setTimeout(() => resolve('user page data'), 1000),
  );

  return { user };
};
