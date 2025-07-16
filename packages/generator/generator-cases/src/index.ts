import {
  ActionElement,
  ActionFunction,
  BooleanConfig,
  Language,
  MWAActionTypes,
  MWAActionTypesMap,
  PackageManager,
  Solution,
} from '@modern-js/generator-common';
import make from 'covertable';

export const LanguageValues = Object.values(Language);
export const PackageManagerValues = Object.values(PackageManager);
export const BooleanConfigValues = Object.values(BooleanConfig);

export const MWAValueMap: Record<string, string[]> = {
  language: LanguageValues,
  packageManager: PackageManagerValues,
};

export const getMWACases = (length?: number) => {
  const cases = make(MWAValueMap, {
    length: length || Object.keys(MWAValueMap).length,
  });
  return cases.map(item => ({
    ...item,
    solution: Solution.MWA,
  }));
};

const getMWAEntryCases = (_length?: number) => {
  return [
    {
      name: 'test',
    },
  ];
};

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
        cases.push({
          ...currentConfig,
        });
      } else if (option === ActionFunction.BFF) {
        // bff only can enable once
        cases.push({
          ...currentConfig,
        });
      } else {
        cases.push(currentConfig);
      }
    });
  });
  return cases;
};

export const MWASubProjectValueMap: Record<string, string[]> = {
  language: LanguageValues,
};
