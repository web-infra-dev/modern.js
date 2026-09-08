import path from 'path';
import { getArgv, getCommand, minimist } from '@modern-js/utils';
import type { AppTools, CliPlugin } from '../types';
import {
  acquireCommandLock,
  getDevLockIntent,
  normalizeLockOperation,
  releaseAllLocks,
  suspendForRestart,
} from '../utils/devLock';

/**
 * Registers the project operation lock. Must be the first plugin in
 * app-tools' `usePlugins` so its `modifyResolvedConfig` runs before the
 * initialize plugin probes the dev port (which logs "Port X is in use,
 * using port Y" — misleading for a process that is about to be rejected)
 * and before the two destructive cleanups in `onPrepare` (`internalDirectory`
 * in the analyze plugin, `dist` in app-tools): a conflict must be reported
 * before anything is printed or deleted.
 */
export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-dev-lock',

  setup: api => {
    api.modifyResolvedConfig(async resolved => {
      const appContext = api.getAppContext();
      const { appDirectory, metaName } = appContext;

      // CLI runs carry the command in argv; programmatic runs put it on the
      // app context. `start` (and the worker variant) normalize to `dev`.
      const operation = normalizeLockOperation(
        getCommand() || (appContext as { command?: string }).command,
      );
      if (!operation) {
        return resolved;
      }

      // The run entry (`createRunOptions`) parses `--allow-multiple` /
      // `RunOptions.allowMultiple` and stores a run-scoped intent; raw argv
      // is only a fallback for callers that drive `cli.init()` directly.
      const intent = getDevLockIntent(appDirectory);
      const args = minimist(getArgv(), {
        boolean: ['allow-multiple', 'watch'],
        alias: { w: 'watch' },
      });
      const allowMultiple =
        intent?.allowMultiple ?? Boolean(args['allow-multiple']);

      // The write set this command will touch. internalDirectory is fixed at
      // plugin-setup time (from `output.tempDir`); distDirectory follows the
      // resolved config passed to this hook, computed here because no plugin
      // has written it onto the app context yet at this point.
      const distRoot = resolved.output?.distPath?.root || 'dist';
      const distDirectory =
        appContext.distDirectory ||
        (path.isAbsolute(distRoot)
          ? distRoot
          : path.resolve(appDirectory, distRoot));

      await acquireCommandLock({
        appDirectory,
        metaName,
        operation,
        allowMultiple: operation === 'dev' && allowMultiple,
        // `build --watch` seen on argv marks the lock persistent up front;
        // programmatic watch is upgraded in the build action itself.
        watch: operation === 'build' && Boolean(args.watch),
        internalDirectory: appContext.internalDirectory,
        distDirectory,
      });
      return resolved;
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
