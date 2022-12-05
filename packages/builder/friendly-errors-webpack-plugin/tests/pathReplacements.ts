import { applyMatcherReplacement } from '@modern-js/utils';
import { snapshotSerializer } from './setup';
import { ErrorTransformer } from '@/shared/types';

export const transformPathReplacements: ErrorTransformer = error => {
  const { pathMatchers } = snapshotSerializer;

  for (const entry of error.trace) {
    entry.file = applyMatcherReplacement(pathMatchers, entry.file);
  }
  error.causes.length && transformPathReplacements(error.causes[0]);
  return error;
};
