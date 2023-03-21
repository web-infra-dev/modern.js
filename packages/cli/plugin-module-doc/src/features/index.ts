import type { Options } from '../types';

export const run = async (options: Options) => {
  const { launchEdenXDoc } = await import('./lanchEdenXDoc');
  const { docgen } = await import('./docgen');
  const { normalizeOptions } = await import('./normalizeOptions');
  await docgen(normalizeOptions(options));
  await launchEdenXDoc(normalizeOptions(options));
};
