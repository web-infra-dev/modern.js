import { join } from 'path';
import { globalStyles } from '../hooks';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { UserConfig } from '@/shared/types';

export async function globalStylesVMPlugin(
  _scanDir: string,
  config: UserConfig,
  _isSSR: boolean,
  runtimeTempDir: string,
) {
  const modulePath = join(runtimeTempDir, `${RuntimeModuleID.GlobalStyles}.js`);
  const globalStylesByPlugins = await globalStyles();
  const moduleContent = [
    config.doc?.globalStyles || '',
    ...globalStylesByPlugins,
  ]
    .filter(source => source.length > 0)
    .map(source => `import '${source}';`)
    .join('');

  return new RuntimeModulesPlugin({
    [modulePath]: moduleContent,
  });
}
