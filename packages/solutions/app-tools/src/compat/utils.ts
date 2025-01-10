import { getModifyHtmlPartials } from '../plugins/analyze/getHtmlTemplate';

/**
 * Maps old plugin hook function names to new plugin API names
 */
export function transformHookRunner(hookRunnerName: string) {
  switch (hookRunnerName) {
    case 'beforeConfig':
      console.error(
        'The `beforeConfig` hook has been deprecated. Please define your code directly in the setup function instead.',
      );
      return undefined;
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

/**
 * Note:
 * isMultiple Indicates whether the function parameter represents multiple values.
 */
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
            top: params[0].partials.top.current,
            head: params[0].partials.head.current,
            body: params[0].partials.body.current,
          },
          entrypoint: params[0].entrypoint,
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
    case 'htmlPartials':
      return {
        partials: getModifyHtmlPartials(result.partials),
        entrypoint: result.entrypoint,
      };
    default:
      return result;
  }
}
