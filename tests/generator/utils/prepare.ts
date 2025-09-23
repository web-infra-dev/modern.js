import os from 'os';
import path from 'path';
import fs from '@modern-js/utils/fs-extra';

export async function prepare(type: string) {
  const isLocal =
    process.env.LOCAL === 'true' || process.env.CUSTOM_LOCAL === 'true';
  const repoDir = path.resolve('../');
  const tmpDir = path.join(os.tmpdir(), 'modern-generators', type);
  await fs.remove(tmpDir);
  await fs.ensureDir(tmpDir);
  return { isLocal, repoDir, tmpDir };
}
