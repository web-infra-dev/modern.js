import type { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Solution {
  MWA = 'mwa',
  Module = 'module',
}

export const SolutionToolsMap: Record<Solution, string> = {
  [Solution.MWA]: '@modern-js/app-tools',
  [Solution.Module]: '@modern-js/module-tools',
};

export const BaseGenerator = '@modern-js/base-generator';
export const PackagesGenerator = '@modern-js/packages-generator';

export const DependenceGenerator = '@modern-js/dependence-generator';
export const EntryGenerator = '@modern-js/entry-generator';
