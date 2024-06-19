import { type RsbuildPlugin } from '@rsbuild/shared';
import { isPackageInstalled } from '@modern-js/utils';
import { isServerTarget } from '../../shared/utils';

export const pluginArco = (): RsbuildPlugin => ({
  name: 'uni-builder:arco',

  setup(api) {
    const ARCO_NAME = '@arco-design/web-react';
    const ARCO_ICON = `${ARCO_NAME}/icon`;

    api.modifyRsbuildConfig(rsbuildConfig => {
      const { transformImport = [] } = rsbuildConfig.source || {};

      if (
        transformImport === false ||
        !isPackageInstalled(ARCO_NAME, api.context.rootPath)
      ) {
        return;
      }

      const isUseSSR = isServerTarget(api.context.targets);

      if (!transformImport?.some(item => item.libraryName === ARCO_NAME)) {
        transformImport.push({
          libraryName: ARCO_NAME,
          libraryDirectory: isUseSSR ? 'lib' : 'es',
          camelToDashComponentName: false,
          style: true,
        });
      }

      if (!transformImport?.some(item => item.libraryName === ARCO_ICON)) {
        transformImport.push({
          libraryName: ARCO_ICON,
          libraryDirectory: isUseSSR ? 'react-icon-cjs' : 'react-icon',
          camelToDashComponentName: false,
        });
      }

      rsbuildConfig.source ||= {};
      rsbuildConfig.source.transformImport = transformImport;
    });
  },
});
