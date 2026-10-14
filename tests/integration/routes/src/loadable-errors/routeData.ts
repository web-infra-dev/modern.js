export const loader = async ({ request }: { request: Request }) => {
  const response = await fetch('/__loadable-route-data', {
    signal: request.signal,
  });
  return response.text();
};
