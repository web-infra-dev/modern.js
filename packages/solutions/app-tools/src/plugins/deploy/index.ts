import { provider } from 'std-env';
import type {
  AppTools,
  AppToolsNormalizedConfig,
  CliPlugin,
} from '../../types';
import type { AppToolsContext } from '../../types/plugin';
import { createAliESAPreset, setupAliESA } from './platforms/ali-esa';
import { createCFWorkersPreset, setupCFWorkers } from './platforms/cf-workers';
import { createEdgeOnePreset, setupEdgeOne } from './platforms/edgeone';
import { createGhPagesPreset } from './platforms/gh-pages';
import { createNetlifyPreset } from './platforms/netlify';
import { createNodePreset } from './platforms/node';
import type { Setup } from './platforms/platform';
import { createVercelPreset } from './platforms/vercel';
import { getProjectUsage } from './utils';
type DeployPresetCreators = {
  node: typeof createNodePreset;
  vercel: typeof createVercelPreset;
  netlify: typeof createNetlifyPreset;
  ghPages: typeof createGhPagesPreset;
  edgeone: typeof createEdgeOnePreset;
  aliEsa: typeof createAliESAPreset;
  cfWorkers: typeof createCFWorkersPreset;
};

type DeployTarget = keyof DeployPresetCreators;

const deployPresets: DeployPresetCreators = {
  node: createNodePreset,
  vercel: createVercelPreset,
  netlify: createNetlifyPreset,
  ghPages: createGhPagesPreset,
  edgeone: createEdgeOnePreset,
  aliEsa: createAliESAPreset,
  cfWorkers: createCFWorkersPreset,
};

const setups: Partial<Record<DeployTarget, Setup>> = {
  edgeone: setupEdgeOne,
  cfWorkers: setupCFWorkers,
  aliEsa: setupAliESA,
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
      `Unknown deploy target: '${deployTarget}'. MODERNJS_DEPLOY should be 'node', 'vercel', 'netlify', 'edgeone' ,'cfWorkers' or 'aliEsa'.`,
    );
  }

  return createPreset(appContext, modernConfig, needModernServer);
}

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-deploy',
  setup: async api => {
    const deployTarget = process.env.MODERNJS_DEPLOY || provider || 'node';

    await setups[deployTarget as DeployTarget]?.(api);

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
