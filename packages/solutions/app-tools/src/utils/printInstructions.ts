import { logger, prettyInstructions } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../types';
import type { AppToolsContext, AppToolsHooks } from '../types/plugin';

export const printInstructions = async (
  hooks: AppToolsHooks,
  appContext: AppToolsContext,
  config: AppNormalizedConfig,
) => {
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const { instructions } = await hooks.onBeforePrintInstructions.call({
    instructions: message,
  });

  logger.log(instructions);
};
