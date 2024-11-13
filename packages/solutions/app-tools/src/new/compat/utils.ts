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
    // case 'config':
    //   return 'config';
    // case 'deploy':
    //   return 'deploy';
    // case 'checkEntryPoint':
    //   return 'checkEntryPoint';
    // case 'modifyEntrypoints':
    //   return 'modifyEntrypoints';
    // case 'modifyFileSystemRoutes':
    //   return 'modifyFileSystemRoutes';
    // case 'modifyServerRoutes':
    //   return 'modifyServerRoutes';
    // case 'generateEntryCode':
    //   return 'generateEntryCode';
    // case '_internalRuntimePlugins':
    //   return '_internalRuntimePlugins';
    // case '_internalServerPlugins':
    //   return '_internalServerPlugins';
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
