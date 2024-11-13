/**
 * Maps old plugin hook function names to new plugin API names
 */
export function transformHookRunner(hookRunnerName: string) {
  switch (hookRunnerName) {
    case 'beforeConfig':
      return 'onBeforeConfig';
    case 'prepare':
      return 'onPrepare';
    case 'afterPrepare':
      return 'onAfterPrepare';
    case 'beforeGenerateRoutes':
      return 'onBeforeGenerateRoutes';
    case 'beforePrintInstructions':
      return 'onBeforePrintInstructions';
    case 'resolvedConfig':
      return 'modifyResolvedConfig';
    case 'commands':
      return 'addCommand';
    case 'watchFiles':
      return 'addWatchFiles';
    case 'filedChange':
      return 'onFileChanged';
    case 'beforeCreateCompiler':
      return 'onBeforeCreateCompiler';
    case 'afterCreateCompiler':
      return 'onAfterCreateCompiler';
    case 'beforeBuild':
      return 'onBeforeBuild';
    case 'afterBuild':
      return 'onAfterBuild';
    case 'beforeDev':
      return 'onBeforeDev';
    case 'afterDev':
      return 'onAfterDev';
    case 'beforeDeploy':
      return 'onBeforeDeploy';
    case 'afterDeploy':
      return 'onAfterDeploy';
    case 'beforeExit':
      return 'onBeforeExit';
    case 'beforeRestart':
      return 'onBeforeRestart';
    case 'htmlPartials':
      return 'modifyHtmlPartials';
    default:
      return hookRunnerName;
  }
}

export function transformHookParams(hookRunnerName: string, params: any) {
  switch (hookRunnerName) {
    case 'resolvedConfig':
      return {
        resolved: params,
      };
    default:
      return params;
  }
}

export function transformHookResult(hookRunnerName: string, result: any) {
  switch (hookRunnerName) {
    case 'resolvedConfig':
      return result.resolved;
    default:
      return result;
  }
}
