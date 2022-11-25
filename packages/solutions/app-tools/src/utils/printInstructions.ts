import { prettyInstructions, logger } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig, ToRunners } from '@modern-js/core';
import type { AppHooks } from '../hooks';

export const printInstructions = async (
  hookRunners: ToRunners<AppHooks>,
  appContext: IAppContext,
  config: NormalizedConfig,
) => {
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const { instructions } = await hookRunners.beforePrintInstructions({
    instructions: message,
  });

  logger.info(instructions);
};
