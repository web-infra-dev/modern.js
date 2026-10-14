export const loader = async ({ request }: { request: Request }) => {
  // Browser tests hold this request to keep the route from rendering while
  // its module preload fails, then either cancel or finish the navigation.
  const response = await fetch('/__lazy-route-data', {
    signal: request.signal,
  });
  return response.text();
};
