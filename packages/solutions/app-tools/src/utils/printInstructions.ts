import { logger, prettyInstructions } from '@modern-js/utils';
import type { AppTools, AppToolsContext } from '../new/types';
import type {
  AppToolsNormalizedConfig,
  AppToolsUserConfig,
} from '../types/config';

export const printInstructions = async (
  api: AppTools<'shared'>,
  appContext: AppToolsContext<'shared'>,
  config: Readonly<AppToolsNormalizedConfig<AppToolsUserConfig<'shared'>>>,
) => {
  console.log('=====appContext.serverRoutes', appContext.serverRoutes);
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const hooks = api.getHooks();
  const { instructions } = (await hooks.onBeforePrintInstructions.call({
    instructions: message,
  })) as any;

  logger.log(instructions);
};
