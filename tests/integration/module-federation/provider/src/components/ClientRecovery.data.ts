import { checkDataFailure } from '../data-failure';
export async function fetchData(params: {
  isDowngrade?: boolean;
  labFailure?: string;
}) {
  await checkDataFailure(params);
  throw new Error('Intentional server failure: use the client data loader');
}
