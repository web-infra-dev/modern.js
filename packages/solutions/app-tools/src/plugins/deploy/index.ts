import { provider } from 'std-env';
import type {
  AppTools,
  AppToolsNormalizedConfig,
  CliPlugin,
} from '../../types';
import type { AppToolsContext } from '../../types/plugin';
import { createGhPagesPreset } from './platforms/gh-pages';
import { createNetlifyPreset } from './platforms/netlify';
import { createNodePreset } from './platforms/node';
import { createVercelPreset } from './platforms/vercel';
import { createEdgeOnePreset } from './platforms/edgeone';
import { createAliESAPreset } from './platforms/ali-esa';
import { getProjectUsage } from './utils';
type DeployPresetCreators = {
  node: typeof createNodePreset;
  vercel: typeof createVercelPreset;
  netlify: typeof createNetlifyPreset;
  ghPages: typeof createGhPagesPreset;
  edgeone: typeof createEdgeOnePreset,
  'ali-esa': typeof createAliESAPreset,
};

type DeployTarget = keyof DeployPresetCreators;

const deployPresets: DeployPresetCreators = {
  node: createNodePreset,
  vercel: createVercelPreset,
  netlify: createNetlifyPreset,
  ghPages: createGhPagesPreset,
  edgeone: createEdgeOnePreset,
  'ali-esa': createAliESAPreset,
};

async function getDeployPreset(
  appContext: AppToolsContext,
  modernConfig: AppToolsNormalizedConfig,
  deployTarget: DeployTarget,
) {
  const { appDirectory, distDirectory, metaName } = appContext;
  const { useSSR, useAPI, useWebServer } = getProjectUsage(
    appDirectory,
    distDirectory,
    metaName,
  );
  const needModernServer = useSSR || useAPI || useWebServer;

  const createPreset = deployPresets[deployTarget];

  if (!createPreset) {
    throw new Error(
      `Unknown deploy target: '${deployTarget}'. MODERNJS_DEPLOY should be 'node', 'vercel', 'netlify', 'edgeone' or 'ali-esa'.`,
    );
  }

  return createPreset(appContext, modernConfig, needModernServer);
}

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-deploy',
  setup: api => {
    const deployTarget = process.env.MODERNJS_DEPLOY || provider || 'node';

    api.deploy(async () => {
      const appContext = api.getAppContext();
      const { metaName } = appContext;
      if (metaName !== 'modern-js' && !process.env.MODERNJS_DEPLOY) {
        return;
      }
      const modernConfig = api.getNormalizedConfig();
      const deployPreset = await getDeployPreset(
        appContext,
        modernConfig,
        deployTarget as DeployTarget,
      );

      deployPreset?.prepare && (await deployPreset?.prepare());
      deployPreset?.writeOutput && (await deployPreset?.writeOutput());
      deployPreset?.genEntry && (await deployPreset?.genEntry());
      deployPreset?.end && (await deployPreset?.end());
    });
  },
});
