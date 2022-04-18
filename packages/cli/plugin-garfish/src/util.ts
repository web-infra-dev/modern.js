/**
 * Tips: this package will be bundled and running in the browser, do not import from `@modern-js/utils`.
 */
import createDebug from 'debug';
import { ModuleInfo } from './runtime';

export const logger = createDebug('modern-js:plugin-garfish');

export const SUBMODULE_APP_COMPONENT_KEY = 'SubModuleComponent';

export function generateSubAppContainerKey(moduleInfo?: ModuleInfo): string {
  return moduleInfo
    ? `modern_sub_app_container_${decodeURIComponent(moduleInfo?.name)}`
    : 'modern_sub_app_container';
}
