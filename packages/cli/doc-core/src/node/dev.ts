import { UserConfig } from 'shared/types';
import { createModernBuilder } from './createBuilder';

export async function dev(rootDir: string, config: UserConfig) {
  const builder = await createModernBuilder(rootDir, config);
  await builder.startDevServer();
}
