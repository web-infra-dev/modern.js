/**
 * ECharts contains zrender.
 * but zrender/lib/zrender use internal Group
 * echarts use zrender/lib/container/Group
 * Those two Group is different in esm.
 * So, inline all zrender imports inside echarts
 */
import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';

const pluginName = 'EchartsPlugin';

class EchartsPlugin implements EsmpackPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.compile.tap(pluginName, compilationParams => {
      const isTargetPackage = compilationParams.specifier.includes('echarts');

      if (isTargetPackage) {
        if (!compilationParams.inlineDependency) {
          compilationParams.inlineDependency = id => {
            if (id.includes('zrender')) {
              return true;
            }
            return false;
          };
        }
      }
    });
  }
}

export { EchartsPlugin };
