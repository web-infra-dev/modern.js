import { CodeSmith } from '@modern-js/codesmith';
import { ora } from '@modern-js/codesmith-utils/ora';

export interface Options {
  cwd?: string;
  debug?: boolean;
  time?: boolean;
  distTag?: string;
  registry?: string;
  needInstall?: boolean;
}

const UPGRADE_GENERATOR = '@modern-js/upgrade-generator';

export async function upgradeAction(options: Options) {
  const {
    cwd = process.cwd(),
    debug = false,
    time = false,
    distTag,
    registry,
    needInstall,
  } = options;
  const projectDir = cwd;

  const smith = new CodeSmith({
    debug,
    time,
  });

  smith.logger?.timing('🕒 Run Upgrade Tools');

  const spinner = ora({
    text: 'Load Generator...',
    spinner: 'runner',
  }).start();
  const prepareGlobalPromise = smith.prepareGlobal();
  const prepareGeneratorPromise = smith.prepareGenerators([UPGRADE_GENERATOR]);

  smith.logger.debug('@modern-js/upgrade', projectDir || '', options);

  let generator = UPGRADE_GENERATOR;

  if (process.env.CODESMITH_ENV === 'development') {
    generator = require.resolve(UPGRADE_GENERATOR);
  } else if (distTag) {
    generator = `${UPGRADE_GENERATOR}@${distTag}`;
    await prepareGeneratorPromise;
  }

  await prepareGlobalPromise;

  spinner.stop();

  try {
    await smith.forge({
      tasks: [
        {
          generator,
          config: {
            debug,
            distTag,
            registry,
            noNeedInstall: !needInstall,
          },
        },
      ],
      pwd: cwd,
    });
  } catch (e) {
    smith.logger?.timing('🕒 Run Upgrade Tools', true);
    process.exit(1);
  }
  smith.logger?.timing('🕒 Run Upgrade Tools', true);
}
