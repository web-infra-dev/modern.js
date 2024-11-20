import type { NormalizedConfig } from '@modern-js/core';
import { provider } from 'std-env';
import type { AppToolsPlugin } from '../../new';
import type { AppToolsContext } from '../../new/types';
import type { AppTools } from '../../types';
import { createNetlifyPreset } from './platforms/netlify';
import { createNodePreset } from './platforms/node';
import { createVercelPreset } from './platforms/vercel';
import { getProjectUsage } from './utils';

type DeployPresetCreators = {
  node: typeof createNodePreset;
  vercel: typeof createVercelPreset;
  netlify: typeof createNetlifyPreset;
};

type DeployTarget = keyof DeployPresetCreators;

const deployPresets: DeployPresetCreators = {
  node: createNodePreset,
  vercel: createVercelPreset,
  netlify: createNetlifyPreset,
};

async function getDeployPreset(
  appContext: AppToolsContext<'shared'>,
  modernConfig: NormalizedConfig<AppTools>,
  deployTarget: DeployTarget,
) {
  const { appDirectory, distDirectory } = appContext;
  const { useSSR, useAPI, useWebServer } = getProjectUsage(
    appDirectory,
    distDirectory!,
  );
  const needModernServer = useSSR || useAPI || useWebServer;

  const createPreset = deployPresets[deployTarget];

  if (!createPreset) {
    throw new Error(
      `Unknown deploy target: '${deployTarget}'. MODERNJS_DEPLOY should be 'node', 'vercel', or 'netlify'.`,
    );
  }

  return createPreset(appContext, modernConfig, needModernServer);
}

export default (): AppToolsPlugin => ({
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
        modernConfig as any,
        deployTarget as DeployTarget,
      );

      deployPreset?.prepare && (await deployPreset?.prepare());
      deployPreset?.writeOutput && (await deployPreset?.writeOutput());
      deployPreset?.genEntry && (await deployPreset?.genEntry());
      deployPreset?.end && (await deployPreset?.end());
    });
  },
});
