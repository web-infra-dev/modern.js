import make from 'covertable';
import {
  Solution,
  PackageManager,
  Language,
  RunWay,
  BooleanConfig,
  ClientRoute,
} from '@modern-js/generator-common';

export const LanguageValues = Object.values(Language);
export const PackageManagerValues = Object.values(PackageManager);
export const RunWayValues = Object.values(RunWay);
export const BooleanConfigValues = Object.values(BooleanConfig);
export const ClientRouteValues = Object.values(ClientRoute);

export const MWAValueMap: Record<string, string[]> = {
  language: LanguageValues,
  packageManager: PackageManagerValues,
  runWay: RunWayValues,
  needModifyMWAConfig: BooleanConfigValues,
  clientRoute: ClientRouteValues,
  disableStateManagement: BooleanConfigValues,
  enableLess: BooleanConfigValues,
  enableSass: BooleanConfigValues,
};

export const ModuleValueMap: Record<string, string[]> = {
  language: LanguageValues,
  packageManager: PackageManagerValues,
  needModifyModuleConfig: BooleanConfigValues,
  enableLess: BooleanConfigValues,
  enableSass: BooleanConfigValues,
};

export const MonorepoValueMap: Record<string, string[]> = {
  packageManager: PackageManagerValues,
};

export const getMWACases = () => {
  const cases = make(MWAValueMap, {
    length: Object.keys(MWAValueMap).length,
    postFilter: (row: Record<string, any>) => {
      if (
        row.needModifyMWAConfig === BooleanConfig.NO &&
        (row.disableStateManagement !== BooleanConfig.NO ||
          row.clientRoute !== ClientRoute.SelfControlRoute ||
          row.enableLess !== BooleanConfig.NO ||
          row.enableSass !== BooleanConfig.NO)
      ) {
        return false;
      }
      return true;
    },
  });
  return cases.map(item => ({
    ...item,
    solution: Solution.MWA,
  }));
};

export const getModuleCases = () => {
  const cases = make(ModuleValueMap, {
    length: Object.keys(ModuleValueMap).length,
    postFilter: (row: Record<string, any>) => {
      if (
        row.needModifyModuleConfig === BooleanConfig.NO &&
        (row.enableLess !== BooleanConfig.NO ||
          row.enableSass !== BooleanConfig.NO)
      ) {
        return false;
      }
      return true;
    },
  });
  return cases.map(item => ({
    ...item,
    solution: Solution.Module,
  }));
};

export const getMonorepoCases = () => {
  const cases = make(MonorepoValueMap, {
    length: Object.keys(MonorepoValueMap).length,
  });
  return cases.map(item => ({
    ...item,
    solution: Solution.Monorepo,
  }));
};
