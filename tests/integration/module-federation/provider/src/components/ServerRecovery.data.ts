export async function fetchData(params: { isDowngrade?: boolean }) {
  if (!params.isDowngrade)
    throw new Error('Intentional first-pass failure: retry through the host');
  return { source: 'server-recovery' };
}
