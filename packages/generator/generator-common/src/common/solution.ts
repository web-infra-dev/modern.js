import type { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Solution {
  MWA = 'mwa',
}

export const SolutionToolsMap: Record<Solution, string> = {
  [Solution.MWA]: '@modern-js/app-tools',
};

export const BaseGenerator = '@modern-js/base-generator';

export const DependenceGenerator = '@modern-js/dependence-generator';
export const EntryGenerator = '@modern-js/entry-generator';
