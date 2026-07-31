import type { CLIPluginAPI } from '@modern-js/plugin';
import { emptyDir } from '@modern-js/utils';
import type { AppTools } from '../types';

/**
 * Empty the dist directory before a build/dev run when `output.cleanDistPath`
 * is enabled.
 *
 * This temporarily lives in the `build`/`dev` commands rather than the CLI
 * `onPrepare` hook: the latter only recognizes CLI argv commands, so it cannot
 * handle programmatic `build`/`dev`/`deploy` calls or `deploy({ skipBuild:
 * true })` reliably. Keeping it at the execution boundary makes CLI and
 * programmatic paths behave identically, and honors `skipBuild` for free (no
 * build call -> no clean).
 *
 * TODO: Move this back to `onPrepare` once it can uniformly recognize the
 * programmatic command and `skipBuild` semantics. The builder itself keeps
 * `cleanDistPath` disabled because `generateRoutes` writes into dist during
 * `builder.build()`, so dist must be emptied up-front rather than by the
 * bundler.
 */
export const cleanDistPath = async (api: CLIPluginAPI<AppTools>) => {
  const resolvedConfig = api.getNormalizedConfig();
  if (resolvedConfig?.output?.cleanDistPath) {
    const appContext = api.getAppContext();
    await emptyDir(appContext.distDirectory);
  }
};
