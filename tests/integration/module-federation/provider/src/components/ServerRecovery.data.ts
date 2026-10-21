import { checkDataFailure } from '../data-failure';
export async function fetchData(params: {
  isDowngrade?: boolean;
  labFailure?: string;
}) {
  await checkDataFailure(params);
  if (!params.isDowngrade)
    throw new Error('Intentional first-pass failure: retry through the host');
  return { source: 'server-recovery' };
}
