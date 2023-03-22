import type { Options } from '../types';

export const run = async (options: Options) => {
  const { launchDoc } = await import('./lanchDoc');
  const { docgen } = await import('./docgen');
  const { normalizeOptions } = await import('./normalizeOptions');
  await docgen(normalizeOptions(options));
  await launchDoc(normalizeOptions(options));
};
