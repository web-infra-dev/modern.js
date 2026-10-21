import { checkDataFailure } from '../../provider/src/data-failure';
let requestCount = 0;
export async function fetchData(params?: { labFailure?: string }) {
  await checkDataFailure(params);
  requestCount += 1;
  return { requestCount };
}
