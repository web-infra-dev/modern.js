import { prettyInstructions, logger } from '@modern-js/utils';
import type {
  IAppContext,
  NormalizedConfig,
  ToRunners,
  CliHooks,
} from '@modern-js/core';

export const printInstructions = async (
  hookRunners: ToRunners<CliHooks>,
  appContext: IAppContext,
  config: NormalizedConfig,
) => {
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const { instructions } = await hookRunners.beforePrintInstructions({
    instructions: message,
  });

  logger.log(instructions);
};
