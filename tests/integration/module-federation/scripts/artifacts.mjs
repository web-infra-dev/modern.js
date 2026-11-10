import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { labRoot } from './groups.mjs';

export function screenshotPath(mode, name) {
  const directory = path.join(
    process.env.MF_LAB_ARTIFACT_DIR ??
      path.join(labRoot, '.artifacts', 'local'),
    'screenshots',
    mode,
  );
  mkdirSync(directory, { recursive: true });
  return path.join(directory, name);
}
