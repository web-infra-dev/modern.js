const version = process.env.MF_LAB_VERSION || 'v1';
export async function fetchData() {
  return {
    source: 'rslib-server',
    temperature: version === 'v2' ? 16 : 24,
    weather: version === 'v2' ? 'rainy' : 'sunny',
  };
}
