import { join } from 'path';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';
import { UserConfig } from '@/shared/types';

export function globalUIComponentsVMPlugin(
  _scanDir: string,
  config: UserConfig,
) {
  let index = 0;
  const modulePath = join(
    PACKAGE_ROOT,
    'node_modules',
    'virtual-global-components.js',
  );
  const moduleContent = [
    ...(config.doc?.globalUIComponents || []),
    ...(config.doc?.plugins || [])
      .map(plugin => plugin.globalUIComponents || [])
      .flat(),
  ]
    .map(source => `import Comp_${index++} from '${source}';`)
    .concat(
      `export default [${Array.from(
        { length: index },
        (_, i) => `Comp_${i}`,
      ).join(', ')}];`,
    )
    .join('');

  return new VirtualModulesPlugin({
    [modulePath]: moduleContent,
  });
}
