export async function fetchData() {
  const response = await fetch(`${process.env.MF_LAB_API}/weather`);
  if (!response.ok) throw new Error('Local weather request failed');
  return response.json();
}
