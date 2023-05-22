import { join } from 'path';
import { globalUIComponents } from '../hooks';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { UserConfig } from '@/shared/types';

export async function globalUIComponentsVMPlugin(
  _scanDir: string,
  config: UserConfig,
  _isSSR: boolean,
  runtimeTempDir: string,
) {
  let index = 0;
  const modulePath = join(
    runtimeTempDir,
    `${RuntimeModuleID.GlobalComponents}.js`,
  );
  const globalUIComponentsByPlugins = await globalUIComponents();
  const moduleContent = [
    ...(config.doc?.globalUIComponents || []),
    ...globalUIComponentsByPlugins,
  ]
    .map(source => `import Comp_${index++} from '${source}';`)
    .concat(
      `export default [${Array.from(
        { length: index },
        (_, i) => `Comp_${i}`,
      ).join(', ')}];`,
    )
    .join('');

  return new RuntimeModulesPlugin({
    [modulePath]: moduleContent,
  });
}
