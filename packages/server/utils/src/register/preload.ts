// Preload for child processes that run an app's server code from source,
// e.g. `node -r @modern-js/server-utils/register entry.js`. The parent passes
// the app through these environment variables.
import { registerServerRuntime } from '.';

const appDirectory = process.env.MODERN_SERVER_APP_DIR || process.cwd();
const tsconfigPath = process.env.MODERN_SERVER_TSCONFIG;

if (tsconfigPath) {
  registerServerRuntime({
    appDirectory,
    distDirectory: process.env.MODERN_SERVER_DIST_DIR || `${appDirectory}/dist`,
    tsconfigPath,
  });
}
