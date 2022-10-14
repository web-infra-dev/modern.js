import make from 'covertable';
import {
  Solution,
  PackageManager,
  Language,
  BooleanConfig,
  ClientRoute,
  MWAActionTypes,
  MWAActionTypesMap,
  Framework,
  BFFType,
  ActionElement,
  ActionFunction,
  ModuleActionTypes,
  ModuleActionTypesMap,
  SubSolution,
} from '@modern-js/generator-common';

export const LanguageValues = Object.values(Language);
export const PackageManagerValues = Object.values(PackageManager);
export const BooleanConfigValues = Object.values(BooleanConfig);
export const ClientRouteValues = Object.values(ClientRoute);
export const FrameworkValues = Object.values(Framework);
export const BFFTypeValues = Object.values(BFFType);

export const MWAValueMap: Record<string, string[]> = {
  language: LanguageValues,
  packageManager: PackageManagerValues,
  needModifyMWAConfig: BooleanConfigValues,
  clientRoute: ClientRouteValues,
};

export const ModuleValueMap: Record<string, string[]> = {
  language: LanguageValues,
  packageManager: PackageManagerValues,
};

export const MonorepoValueMap: Record<string, string[]> = {
  packageManager: PackageManagerValues.filter(
    packageManager => packageManager !== 'npm',
  ),
};

export const getMWACases = (length?: number) => {
  const cases = make(MWAValueMap, {
    length: length || Object.keys(MWAValueMap).length,
    postFilter: (row: Record<string, any>) => {
      if (
        row.needModifyMWAConfig === BooleanConfig.NO &&
        row.clientRoute !== ClientRoute.SelfControlRoute
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

export const getModuleCases = (length?: number) => {
  const cases = make(ModuleValueMap, {
    length: length || Object.keys(ModuleValueMap).length,
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

export const MWAEntryValueMap: Record<string, string[]> = {
  needModifyMWAConfig: BooleanConfigValues,
  clientRoute: ClientRouteValues,
};

const getMWAEntryCases = (length?: number) => {
  const cases = make(MWAEntryValueMap, {
    length: length || Object.keys(MWAEntryValueMap).length,
  });
  return cases.map(item => ({
    ...item,
    name: Object.values(item).join('-'),
  }));
};

export const MWAServerValueMap: Record<string, string[]> = {
  framework: FrameworkValues,
};

const getMWAServerCases = () =>
  make(MWAServerValueMap, {
    length: Object.keys(MWAServerValueMap).length,
  });

export const MWABFFValueMap: Record<string, string[]> = {
  bffType: BFFTypeValues,
  framework: FrameworkValues,
};

const getMWABFFCases = (length?: number) =>
  make(MWABFFValueMap, {
    length: length || Object.keys(MWABFFValueMap).length,
  });

export const getMWANewCases = (length?: number) => {
  const cases: Array<Record<string, string>> = [];
  MWAActionTypes.forEach(action => {
    const config: Record<string, any> = { actionType: action };
    MWAActionTypesMap[action].forEach(option => {
      config[action] = option;
      const currentConfig = { ...config, [action]: option };
      if (option === ActionElement.Entry) {
        const entryCases = getMWAEntryCases(length);
        entryCases.forEach(c => {
          cases.push({ ...currentConfig, ...c });
        });
      } else if (option === ActionElement.Server) {
        // server only can enable once
        const serverCases = getMWAServerCases();
        cases.push({
          ...currentConfig,
          ...serverCases[Math.round(Math.random() * serverCases.length)],
        });
      } else if (option === ActionFunction.BFF) {
        // bff only can enable once
        const bffCases = getMWABFFCases(length);
        cases.push({
          ...currentConfig,
          ...bffCases[Math.round(Math.random() * bffCases.length)],
        });
      } else {
        cases.push(currentConfig);
      }
    });
  });
  return cases;
};

export const getModuleNewCases = () => {
  const cases: Array<Record<string, string>> = [];
  ModuleActionTypes.forEach(action => {
    const config: Record<string, any> = { actionType: action };
    ModuleActionTypesMap[action].forEach(option => {
      const currentConfig = { ...config, [action]: option };
      cases.push(currentConfig);
    });
  });
  return cases;
};

export const MWASubProjectValueMap: Record<string, string[]> = {
  language: LanguageValues,
  needModifyMWAConfig: BooleanConfigValues,
  clientRoute: ClientRouteValues,
};

export const ModuleSubProjectValueMap: Record<string, string[]> = {
  language: LanguageValues,
};

const getMWASubProjectCases = (isTest: boolean, length?: number) => {
  const cases = make(MWASubProjectValueMap, {
    length: length || Object.keys(MWASubProjectValueMap).length,
    postFilter: (row: Record<string, any>) => {
      if (
        row.needModifyMWAConfig === BooleanConfig.NO &&
        row.clientRoute !== ClientRoute.SelfControlRoute
      ) {
        return false;
      }
      return true;
    },
  });
  return cases.map(item => ({
    ...item,
    packageName: Object.values(item).join('-'),
    packagePath: Object.values(item).join('-'),
    solution: isTest ? SubSolution.MWATest : SubSolution.MWA,
  }));
};

const getModuleSubProjectCases = (isInner: boolean, length?: number) => {
  const cases = make(ModuleSubProjectValueMap, {
    length: length || Object.keys(ModuleSubProjectValueMap).length,
  });
  return cases.map(item => ({
    ...item,
    packageName: Object.values(item).join('-'),
    packagePath: Object.values(item).join('-'),
    solution: isInner ? SubSolution.InnerModule : SubSolution.Module,
  }));
};

export const getMonorepoNewCases = (length?: number) => {
  const cases: Array<Record<string, string>> = [
    ...getMWASubProjectCases(false, length),
    ...getMWASubProjectCases(true, length),
    ...getModuleSubProjectCases(false, length),
    ...getModuleSubProjectCases(true, length),
  ];
  return cases;
};
