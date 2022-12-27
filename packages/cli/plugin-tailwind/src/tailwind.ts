import { applyOptionsChain, logger } from '@modern-js/utils';
import { merge, cloneDeep } from '@modern-js/utils/lodash';
import { DesignSystem, Tailwind } from './types';

const checkIfExistNotAllowKeys = (
  tailwindConfig: Record<string, any>,
): [boolean, string] => {
  const notAllowExistKeys = ['theme'];
  let notAllowKey = '';

  const ret = Object.keys(tailwindConfig).some(
    key => notAllowExistKeys.includes(key) && (notAllowKey = key),
  );

  return [ret, notAllowKey];
};

const getPureDesignSystemConfig = (designSystemConfig: DesignSystem) => {
  const pureDesignSystemConfig = cloneDeep(designSystemConfig);
  delete pureDesignSystemConfig.supportStyledComponents;
  return pureDesignSystemConfig;
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

  const [exist, key] = checkIfExistNotAllowKeys(tailwindConfig);

  if (exist) {
    logger.error(
      `should not exist '${key}' on tools.tailwindcss, please remove it`,
    );
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  // Because there is no default theme configuration
  tailwindConfig.theme = designSystemConfig || {};

  return tailwindConfig;
};

export { getTailwindConfig };
