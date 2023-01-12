import path from 'path';
import { UserConfig } from 'shared/types';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';

export async function dev(rootDir: string, config: UserConfig) {
  const builder = await createModernBuilder(rootDir, config);
  await builder.startDevServer();
  const userRoot = path.resolve(rootDir || config.doc?.root || process.cwd());
  await writeSearchIndex(userRoot, config);
}
