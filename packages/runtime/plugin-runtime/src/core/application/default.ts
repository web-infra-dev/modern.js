import { getApplicationEntry } from '../context';
import { getRuntimeDefinition } from '../plugin';
import type { ApplicationDefinition } from './definition';
export function getDefaultApplicationDefinition(): ApplicationDefinition {
  const entry = getApplicationEntry();
  return {
    ...entry,
    globalApp: entry.layoutApp,
    createRuntime: getRuntimeDefinition(),
  };
}
