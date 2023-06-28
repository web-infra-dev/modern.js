import type { Options } from '../types';

export const run = async (options: Options) => {
  const { launchDoc } = await import('./lanchDoc');
  const { normalizeOptions } = await import('./normalizeOptions');
  await launchDoc(normalizeOptions(options));
};
