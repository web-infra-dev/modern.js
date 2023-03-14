import { join } from 'path';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { UserConfig } from '@/shared/types';

export function globalStylesVMPlugin(_scanDir: string, config: UserConfig) {
  const modulePath = join(
    process.cwd(),
    'node_modules',
    `${RuntimeModuleID.GlobalStyles}.js`,
  );
  const moduleContent = [
    config.doc?.globalStyles || '',
    ...(config.doc?.plugins || []).map(plugin => plugin.globalStyles || ''),
  ]
    .filter(source => source.length > 0)
    .map(source => `import '${source}';`)
    .join('');

  return new RuntimeModulesPlugin({
    [modulePath]: moduleContent,
  });
}
