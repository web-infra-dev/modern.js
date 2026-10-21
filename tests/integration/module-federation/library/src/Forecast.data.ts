import { checkDataFailure } from '../../provider/src/data-failure';
const version = process.env.MF_LAB_VERSION || 'v1';
export async function fetchData(params?: { labFailure?: string }) {
  await checkDataFailure(params);
  return {
    source: 'rslib-server',
    temperature: version === 'v2' ? 16 : 24,
    weather: version === 'v2' ? 'rainy' : 'sunny',
  };
}
