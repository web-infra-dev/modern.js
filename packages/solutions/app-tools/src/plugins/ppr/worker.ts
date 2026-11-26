/**
 * Runs the build-time prerender in a child process. Server code may start
 * timers or keep connections open; ending this process when the prerender is
 * done keeps such side effects out of the build process.
 */
import { PPR_MANIFEST_FILE, fs, logger } from '@modern-js/utils';
import path from 'path';
import {
  type PrerenderInput,
  deserializeConfig,
  runPrerender,
} from './prerender';

async function main() {
  const inputPath = process.argv[2];
  const input = deserializeConfig(
    await fs.readFile(inputPath, 'utf8'),
  ) as PrerenderInput;
  const manifest = await runPrerender(input);
  await fs.outputJSON(
    path.join(input.distDirectory, PPR_MANIFEST_FILE),
    manifest,
  );
}

main().then(
  () => process.exit(0),
  error => {
    logger.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  },
);
