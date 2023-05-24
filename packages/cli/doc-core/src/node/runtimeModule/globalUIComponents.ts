import { join } from 'path';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { FactoryContext, RuntimeModuleID } from '.';

export async function globalUIComponentsVMPlugin(context: FactoryContext) {
  const { runtimeTempDir, config, pluginDriver } = context;
  let index = 0;
  const modulePath = join(
    runtimeTempDir,
    `${RuntimeModuleID.GlobalComponents}.js`,
  );
  const globalUIComponentsByPlugins = pluginDriver.globalUIComponents();
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
