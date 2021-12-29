import type { NormalizedConfig } from '@modern-js/core';
import { Import, applyOptionsChain, logger } from '@modern-js/utils';

const cloneDeep: typeof import('lodash.clonedeep') = Import.lazy(
  'lodash.clonedeep',
  require,
);
const merge: typeof import('lodash.merge') = Import.lazy(
  'lodash.merge',
  require,
);

const getThemeConfig = (
  config: NormalizedConfig & {
    source: {
      designSystem: Record<string, any>;
      theme: Record<string, any> | boolean;
      designToken?: {
        tailwindcss?: boolean;
      };
    };
  },
  tailwindConfig: Record<string, any>,
) => {
  const {
    source: {
      designSystem,
      theme = false,
      designToken = {
        tailwindcss: true,
      },
    },
  } = config;
  // tools.tailwindcss.theme || source.theme || source.designSystem
  // tools.tailwindcss.theme
  if (tailwindConfig.theme) {
    if (theme && designToken.tailwindcss !== false) {
      logger.error(
        'tools.tailwindcss.theme 不能与 source.theme 配置同时存在. 请设置 source.designToken.tailwindcss = false 或者移除其中一个配置',
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    if (designSystem) {
      logger.error(
        'tools.tailwindcss.theme 与 source.designSystem 不能同时存在，请使用 tools.tailwindcss.theme 替换 source.designSystem 配置',
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    return tailwindConfig.theme;
  }
  // only have source.theme, and not have tools.tailwindcss
  if (theme) {
    if (designSystem) {
      logger.error(
        'source.designSystem 与 source.theme 不能同时存在，请将 source.designSystem 替换为 source.theme',
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    } else if (designToken.tailwindcss === false) {
      return {};
    }

    // theme is true or object
    return typeof theme === 'boolean' ? {} : cloneDeep(theme);
  }

  if (designSystem) {
    const pureDesignSystemConfig = cloneDeep(designSystem || {});
    delete pureDesignSystemConfig.supportStyledComponents;
    return pureDesignSystemConfig;
  }

  return {};
};

const getTailwindConfig = (
  config: NormalizedConfig,
  option: { pureConfig?: Record<string, any> } = {},
) => {
  const {
    source: { designToken },
  } = config as NormalizedConfig & {
    source: {
      designToken?: {
        tailwindcss?: boolean;
        defaultTheme?: boolean;
      };
    };
  }; // TODO: type fix
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
  const defaultTailwindConfig = {
    purge: purgeConfig,
  };
  const tailwindConfig = applyOptionsChain(
    defaultTailwindConfig,
    (config.tools as any).tailwindcss || {},
  );

  // Because there is no default theme configuration
  tailwindConfig.theme = getThemeConfig(
    config as NormalizedConfig & {
      source: {
        designSystem: Record<string, any>;
        theme: Record<string, any> | boolean;
        designToken?: {
          tailwindcss?: boolean;
        };
      };
    },
    tailwindConfig,
  );

  // https://v2.tailwindcss.com/docs/presets#disabling-the-default-configuration
  if (
    typeof designToken === 'object' &&
    designToken !== null &&
    designToken.tailwindcss !== false &&
    designToken.defaultTheme === false
  ) {
    tailwindConfig.presets = [];
  }

  return tailwindConfig;
};

export { getTailwindConfig };
