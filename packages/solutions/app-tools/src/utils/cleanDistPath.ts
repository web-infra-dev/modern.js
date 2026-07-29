import type { CLIPluginAPI } from '@modern-js/plugin';
import { emptyDir } from '@modern-js/utils';
import type { AppTools } from '../types';

/**
 * Empty the dist directory before a build/dev run when `output.cleanDistPath`
 * is enabled.
 *
 * This lives in the `build`/`dev` commands rather than the `onPrepare` hook on
 * purpose: `onPrepare` runs during initialization, before a programmatic
 * `deploy({ skipBuild: true })` has a chance to opt out, and it only had access
 * to the CLI argv command (not `appContext.command`). Cleaning here means the
 * CLI and programmatic paths behave identically, and `skipBuild` is honored for
 * free (no build call -> no clean). The builder itself keeps `cleanDistPath`
 * disabled because `generateRoutes` writes into dist during `builder.build()`,
 * so dist must be emptied up-front rather than by the bundler.
 */
export const cleanDistPath = async (api: CLIPluginAPI<AppTools>) => {
  const resolvedConfig = api.getNormalizedConfig();
  if (resolvedConfig?.output?.cleanDistPath) {
    const appContext = api.getAppContext();
    await emptyDir(appContext.distDirectory);
  }
};
