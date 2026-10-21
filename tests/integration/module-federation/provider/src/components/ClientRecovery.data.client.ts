import { checkDataFailure } from '../data-failure';
export async function fetchData(params?: { labFailure?: string }) {
  await checkDataFailure(params);
  return { source: 'client-recovery' };
}
