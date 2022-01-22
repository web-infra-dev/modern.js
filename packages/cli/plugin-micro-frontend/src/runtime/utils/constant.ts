import { ModuleInfo } from '../typings';

export const SUBMODULE_APP_COMPONENT_KEY = 'SubModuleComponent';

export const JUPITER_SUBMODULE_APP_COMPONENT_KEY = 'jupiter_submodule_app_key';

export function generateSubAppContainerKey(moduleInfo?: ModuleInfo): string {
  return moduleInfo
    ? `modern_sub_app_container_${decodeURIComponent(moduleInfo?.name)}`
    : 'modern_sub_app_container';
}
