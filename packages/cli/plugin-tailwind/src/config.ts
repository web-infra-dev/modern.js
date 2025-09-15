import path from 'path';
import { bundleRequire } from '@modern-js/node-bundle-require';
import { fs, applyOptionsChain, findExists } from '@modern-js/utils';
import type { ExtraTailwindConfig, TailwindConfig } from './types';

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
 * `tools.tailwindcss` (extraConfig) > `tailwind.config.*` (userConfig) > `defaultConfig`
 */
const getTailwindConfig = ({
  tailwindVersion,
  appDirectory,
  userConfig,
  extraConfig,
}: {
  tailwindVersion: '2' | '3';
  appDirectory: string;
  userConfig: TailwindConfig;
  extraConfig?: ExtraTailwindConfig;
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

  return tailwindConfig;
};

export { getTailwindConfig };
