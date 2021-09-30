import { ModuleInfo } from '../typings';

export const SUBMODULE_APP_COMPONENT_KEY = 'SubModuleComponent';

export function generateSubAppContainerKey(moduleInfo?: ModuleInfo): string {
  return moduleInfo
    ? `modern_sub_app_container_${decodeURIComponent(moduleInfo?.name)}`
    : 'modern_sub_app_container';
}
