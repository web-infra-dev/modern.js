import { join } from 'path';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { UserConfig } from '@/shared/types';

export function globalStylesVMPlugin(
  _scanDir: string,
  config: UserConfig,
  _isSSR: boolean,
  runtimeTempDir: string,
) {
  const modulePath = join(runtimeTempDir, `${RuntimeModuleID.GlobalStyles}.js`);
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
