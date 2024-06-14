import { ModuleInfo } from './useModuleApps';

declare const __GARFISH_EXPORTS__: string;

export function isRenderGarfish(params?: { appName?: string }) {
  const renderByGarfish =
    typeof __GARFISH_EXPORTS__ !== 'undefined' ||
    (typeof window !== 'undefined' &&
      window.Garfish &&
      window.Garfish.activeApps &&
      window.Garfish.activeApps.some(
        app => app.appInfo?.name === params?.appName,
      ));
  return renderByGarfish;
}

export const SUBMODULE_APP_COMPONENT_KEY = 'SubModuleComponent';

export function generateSubAppContainerKey(moduleInfo?: ModuleInfo): string {
  return moduleInfo
    ? `modern_sub_app_container_${decodeURIComponent(moduleInfo?.name)}`
    : 'modern_sub_app_container';
}
