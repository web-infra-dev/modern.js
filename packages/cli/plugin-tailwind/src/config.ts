import path from 'path';
import { bundleRequire } from '@modern-js/node-bundle-require';
import { fs, applyOptionsChain, findExists } from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import type {
  DesignSystem,
  ExtraTailwindConfig,
  TailwindConfig,
} from './types';

function getDefaultContent(appDirectory: string) {
  const defaultContent = ['./src/**/*.{js,jsx,ts,tsx}'];

  // Only add storybook and html config when they exist
  // Otherwise, it will cause an unnecessary rebuild
  if (fs.existsSync(path.join(appDirectory, 'storybook'))) {
    defaultContent.push('./storybook/**/*');
  }
  if (fs.existsSync(path.join(appDirectory, 'config/html'))) {
    defaultContent.push('./config/html/**/*.{html,ejs,hbs}');
  }

  return defaultContent;
}

const getPureDesignSystemConfig = (config: DesignSystem) => {
  const pureConfig = cloneDeep(config);
  delete pureConfig.supportStyledComponents;
  return pureConfig;
};

const getV2PurgeConfig = (content: string[]) => ({
  enabled: process.env.NODE_ENV === 'production',
  layers: ['utilities'],
  content,
});

export async function loadConfigFile(appDirectory: string) {
  const extensions = ['ts', 'js', 'cjs', 'mjs'];
  const configs = extensions.map(ext =>
    path.resolve(appDirectory, `tailwind.config.${ext}`),
  );
  const configFile = findExists(configs);

  if (configFile) {
    const mod = await bundleRequire(configFile);
    return {
      path: configFile,
      content: mod.default || mod,
    };
  }

  return {
    content: {},
  };
}

/**
 * Config priority:
 * `source.designSystem` > `tools.tailwindcss` (extraConfig) > `tailwind.config.*` (userConfig) > `defaultConfig`
 */
const getTailwindConfig = ({
  tailwindVersion,
  appDirectory,
  userConfig,
  extraConfig,
  designSystem,
}: {
  tailwindVersion: '2' | '3';
  appDirectory: string;
  userConfig: TailwindConfig;
  extraConfig?: ExtraTailwindConfig;
  designSystem?: DesignSystem;
}) => {
  const content = getDefaultContent(appDirectory);

  let tailwindConfig: TailwindConfig =
    tailwindVersion === '3'
      ? { content }
      : { purge: getV2PurgeConfig(content) };

  Object.assign(tailwindConfig, userConfig);

  tailwindConfig = extraConfig
    ? applyOptionsChain(tailwindConfig, extraConfig)
    : tailwindConfig;

  const designSystemConfig = getPureDesignSystemConfig(designSystem ?? {});

  // if designSystem config is used, it will override the theme config of tailwind
  if (designSystemConfig && Object.keys(designSystemConfig).length > 0) {
    tailwindConfig.theme = designSystemConfig;
  }

  return tailwindConfig;
};

export { getTailwindConfig };
