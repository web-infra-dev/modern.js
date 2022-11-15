import type { BuilderPlugin, RemOptions, PxToRemOptions } from '../types';

const defaultOptions: RemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export const PluginRem = (): BuilderPlugin => ({
  name: 'builder-plugin-rem',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { CHAIN_ID }) => {
      const { output: { convertToRem } = {} } = api.getBuilderConfig();

      if (!convertToRem) {
        return;
      }

      const userOptions = {
        ...defaultOptions,
        ...(typeof convertToRem === 'boolean' ? {} : convertToRem),
      };

      // handle css
      const { default: PxToRemPlugin } = (await import(
        '../../compiled/postcss-pxtorem'
      )) as {
        default: (_opts: PxToRemOptions) => any;
      };

      [CHAIN_ID.RULE.CSS, CHAIN_ID.RULE.LESS, CHAIN_ID.RULE.SASS].forEach(
        name => {
          (
            rspackConfig.module?.rules
              ?.find(item => item.name === name)
              ?.uses?.find(item => item.name === CHAIN_ID.USE.POSTCSS)
              ?.options as any
          )?.postcssOptions.plugins.push(
            PxToRemPlugin({
              rootValue: userOptions.rootFontSize,
              unitPrecision: 5,
              propList: ['*'],
              ...(userOptions.pxtorem || {}),
            }),
          );
        },
      );

      // todo  handle runtime (html)
    });
  },
});
