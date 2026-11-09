export const loader = async ({ request }: { request: Request }) => {
  const response = await fetch(`${process.env.MF_LAB_API}/weather`, {
    signal: request.signal,
  });
  if (!response.ok) throw new Error('Weather station unavailable');
  return { weather: await response.json() };
};
