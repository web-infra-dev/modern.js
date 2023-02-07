import { join } from 'path';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';
import { UserConfig } from '@/shared/types';

export function globalStylesVMPlugin(_scanDir: string, config: UserConfig) {
  const modulePath = join(
    PACKAGE_ROOT,
    'node_modules',
    'virtual-global-styles.js',
  );
  const moduleContent = [
    config.doc?.globalStyles || '',
    ...(config.doc?.plugins || []).map(plugin => plugin.globalStyles || ''),
  ]
    .filter(source => source.length > 0)
    .map(source => `import '${source}';`)
    .join('');

  return new VirtualModulesPlugin({
    [modulePath]: moduleContent,
  });
}
