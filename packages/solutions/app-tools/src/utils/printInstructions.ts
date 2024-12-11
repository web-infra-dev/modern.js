import type { CliHooksRunner, IAppContext } from '@modern-js/core';
import { logger, prettyInstructions } from '@modern-js/utils';
import type { AppNormalizedConfig, AppTools } from '../types';
import type { AppToolsContext, AppToolsHooks } from '../types/new';

export const printInstructions = async (
  hooks: AppToolsHooks<'shared'>,
  appContext: AppToolsContext<'shared'>,
  config: AppNormalizedConfig<'shared'>,
) => {
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const { instructions } = await hooks.onBeforePrintInstructions.call({
    instructions: message,
  });

  logger.log(instructions);
};
