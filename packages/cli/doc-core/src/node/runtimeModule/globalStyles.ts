import { join } from 'path';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { FactoryContext, RuntimeModuleID } from '.';

export async function globalStylesVMPlugin(context: FactoryContext) {
  const { runtimeTempDir, config, pluginDriver } = context;
  const modulePath = join(runtimeTempDir, `${RuntimeModuleID.GlobalStyles}.js`);
  const globalStylesByPlugins = pluginDriver.globalStyles();
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
