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
    case 'fileChange':
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
        isMultiple: false,
        params: {
          resolved: params[0],
        },
      };
    case 'htmlPartials':
      return {
        isMultiple: false,
        params: {
          partials: {
            top: params.partials.top.current,
            head: params.partials.head.current,
            body: params.partials.body.current,
          },
          entrypoint: params.entrypoint,
        },
      };
    case 'jestConfig': {
      return {
        isMultiple: true,
        params: params,
      };
    }
    default:
      return {
        isMultiple: false,
        params: params[0],
      };
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
