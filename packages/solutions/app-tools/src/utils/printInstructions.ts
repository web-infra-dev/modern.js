import { prettyInstructions, logger } from '@modern-js/utils';
import type {
  IAppContext,
  CliNormalizedConfig,
  CliHooksRunner,
} from '@modern-js/core';
import type { AppTools } from '../types';

export const printInstructions = async (
  hookRunners: CliHooksRunner<AppTools>,
  appContext: IAppContext,
  config: CliNormalizedConfig<AppTools>,
) => {
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const { instructions } = await hookRunners.beforePrintInstructions({
    instructions: message,
  });

  logger.info(instructions);
};
