import { join } from 'path';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { UserConfig } from '@/shared/types';

export function globalUIComponentsVMPlugin(
  _scanDir: string,
  config: UserConfig,
) {
  let index = 0;
  const modulePath = join(
    process.cwd(),
    'node_modules',
    `${RuntimeModuleID.GlobalComponents}.js`,
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

  return new RuntimeModulesPlugin({
    [modulePath]: moduleContent,
  });
}
