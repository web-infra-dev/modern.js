import { getArgv, getCommand, minimist } from '@modern-js/utils';
import type { AppTools, CliPlugin } from '../types';
import {
  acquireCommandLock,
  normalizeLockOperation,
  releaseAllLocks,
  suspendForRestart,
} from '../utils/devLock';

/**
 * Registers the project operation lock. Must be the first plugin in
 * app-tools' `usePlugins` so its `onPrepare` runs before the two destructive
 * cleanups (`internalDirectory` in the analyze plugin, `dist` in app-tools) —
 * a conflict must be reported before anything gets deleted.
 */
export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-dev-lock',

  setup: api => {
    api.onPrepare(async () => {
      const appContext = api.getAppContext();
      const { appDirectory, metaName } = appContext;

      // CLI runs carry the command in argv; programmatic runs put it on the
      // app context. `start` (and the worker variant) normalize to `dev`.
      const operation = normalizeLockOperation(
        getCommand() || (appContext as { command?: string }).command,
      );
      if (!operation) {
        return;
      }

      // The flag is consumed here, before Commander parses the command
      // action options (which happens after `onPrepare`).
      const args = minimist(getArgv(), {
        boolean: ['allow-multiple'],
      });

      await acquireCommandLock({
        appDirectory,
        metaName,
        operation,
        allowMultiple: operation === 'dev' && Boolean(args['allow-multiple']),
      });
    });

    // Config hot restart re-runs the whole CLI init in the same process:
    // keep the lock file (it is still ours), only stop the heartbeat.
    api.onBeforeRestart(() => {
      const { appDirectory, metaName } = api.getAppContext();
      suspendForRestart(appDirectory, metaName);
    });

    // The CLI owns SIGINT/SIGTERM and funnels every exit through this hook.
    api.onBeforeExit(() => {
      releaseAllLocks();
    });
  },
});
