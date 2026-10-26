import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from '@rstest/core';
import { getMFConfig } from './configPlugin';

it('reloads an edited TypeScript MF config in the same process', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'modern-mf-reload-'));
  const configPath = path.join(directory, 'module-federation.config.ts');
  try {
    await writeFile(configPath, "export default { name: 'first' }");
    expect((await getMFConfig({ configPath })).name).toBe('first');
    await writeFile(configPath, "export default { name: 'second' }");
    expect((await getMFConfig({ configPath })).name).toBe('second');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
