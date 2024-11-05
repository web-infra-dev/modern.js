import type { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Solution {
  MWA = 'mwa',
  Module = 'module',
}

export const SolutionText: Record<Solution, () => string> = {
  [Solution.MWA]: () => i18n.t(localeKeys.solution.mwa),
  [Solution.Module]: () => i18n.t(localeKeys.solution.module),
};

export const SolutionToolsMap: Record<Solution, string> = {
  [Solution.MWA]: '@modern-js/app-tools',
  [Solution.Module]: '@modern-js/module-tools',
};

export const getScenesSchema = (extra: Record<string, any> = {}): Schema => {
  const hasPlugin =
    extra?.customPlugin?.[extra?.solution] &&
    extra.customPlugin[extra?.solution].length > 0;
  return {
    type: 'object',
    properties: hasPlugin
      ? {
          scenes: {
            type: 'string',
            title: i18n.t(localeKeys.scenes.self),
            enum: (() => {
              const solution = extra?.solution;
              const items = (
                extra?.customPlugin ? extra?.customPlugin[solution] || [] : []
              ).map((plugin: any) => ({
                value: plugin.key,
                label:
                  extra.locale === 'zh'
                    ? plugin.name_zh || plugin.name
                    : plugin.name,
              }));
              if (solution && solution !== 'custom') {
                items.unshift({
                  value: solution,
                  label: `${SolutionText[solution as Solution]()}(${i18n.t(
                    localeKeys.solution.default,
                  )})`,
                });
              }
              return items;
            })(),
          },
        }
      : {},
  };
};

export const BaseGenerator = '@modern-js/base-generator';
export const PackagesGenerator = '@modern-js/packages-generator';

export const DependenceGenerator = '@modern-js/dependence-generator';
export const EntryGenerator = '@modern-js/entry-generator';
