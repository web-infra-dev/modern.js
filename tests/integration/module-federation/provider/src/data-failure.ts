export async function checkDataFailure(params?: { labFailure?: string }) {
  if (params?.labFailure !== 'data' && params?.labFailure !== 'invalid') return;
  const response = await fetch(
    `${process.env.MF_LAB_API}/weather?failure=${params.labFailure}`,
  );
  if (!response.ok) throw new Error(`LAB_WEATHER_API: HTTP ${response.status}`);
  const data = await response.json();
  if (typeof data.temperature !== 'number')
    throw new Error('LAB_WEATHER_API: Invalid temperature');
}
