import { useLocation } from '@modern-js/plugin-router';
import { ModuleInfo } from '../typings';

const useIsMatchedCurrentApp = (
  moduleInfo: ModuleInfo,
  useGarfishRouter = false,
) => {
  const { pathname } = useLocation();

  if (!useGarfishRouter) {
    return true;
  }

  if (!moduleInfo) {
    return false;
  }

  return pathname.startsWith(moduleInfo.activeWhen as string);
};

export { useIsMatchedCurrentApp };
