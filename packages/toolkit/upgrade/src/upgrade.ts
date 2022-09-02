import { CodeSmith } from '@modern-js/codesmith';

export interface Options {
  cwd?: string;
  debug?: boolean;
  distTag?: string;
  registry?: string;
}

const UPGRADE_GENERATOR = '@modern-js/upgrade-generator';

export async function upgradeAction(options: Options) {
  const { cwd = process.cwd(), debug = false, distTag, registry } = options;
  const projectDir = cwd;

  const smith = new CodeSmith({
    debug,
  });

  smith.logger.debug('@modern-js/upgrade', projectDir || '', options);

  let generator = UPGRADE_GENERATOR;

  if (process.env.CODESMITH_ENV === 'development') {
    generator = require.resolve(UPGRADE_GENERATOR);
  } else if (distTag) {
    generator = `${UPGRADE_GENERATOR}@${distTag}`;
  }

  try {
    await smith.forge({
      tasks: [
        {
          generator,
          config: { debug, distTag, registry },
        },
      ],
      pwd: cwd,
    });
  } catch (e) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}
