import { applyOptionsChain } from '@modern-js/utils';
import { merge, cloneDeep } from '@modern-js/utils/lodash';
import { DesignSystem, Tailwind } from './types';

const getPureDesignSystemConfig = (config: DesignSystem) => {
  const pureConfig = cloneDeep(config);
  delete pureConfig.supportStyledComponents;
  return pureConfig;
};

const getTailwindConfig = (
  tailwindVersion: '2' | '3',
  tailwindcss?: Tailwind,
  designSystem?: DesignSystem,
  option: { pureConfig?: Record<string, any> } = {},
) => {
  const purgeConfig = merge(
    {
      // TODO: how the operating environment is determined
      enabled: process.env.NODE_ENV === 'production',
      // TODO: Remove or not
      layers: ['utilities'],
      content: [],
    },
    option.pureConfig || {},
  );

  const defaultTailwindConfig =
    tailwindVersion === '3'
      ? { content: purgeConfig.content }
      : {
          purge: purgeConfig,
        };

  const tailwindConfig = applyOptionsChain(
    defaultTailwindConfig,
    tailwindcss || {},
  );

  const designSystemConfig = getPureDesignSystemConfig(designSystem ?? {});

  // if designSystem config is used, it will override the theme config of tailwind
  if (designSystemConfig && Object.keys(designSystemConfig).length > 0) {
    tailwindConfig.theme = designSystemConfig;
  }

  return tailwindConfig;
};

export { getTailwindConfig };
