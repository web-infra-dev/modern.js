import { Schema } from '@modern-js/codesmith-formily';
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

export const getSolutionSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: {
      solution: {
        type: 'string',
        title: extra.isMonorepo
          ? i18n.t(localeKeys.sub_solution.self)
          : i18n.t(localeKeys.solution.self),
        enum: (() => {
          const items = (extra?.solutions || Object.values(Solution)).map(
            (solution: unknown) => ({
              value: solution,
              label: SolutionText[solution as Solution](),
            }),
          );
          if (extra?.customPlugin?.custom?.length) {
            return [
              ...items,
              {
                value: 'custom',
                label: i18n.t(localeKeys.solution.custom),
              },
            ];
          }
          return items;
        })(),
      },
    },
  };
};

export const getScenesSchema = (extra: Record<string, any> = {}): Schema => {
  const hasPlugin =
    extra?.customPlugin &&
    extra.customPlugin[extra?.solution] &&
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

export const SolutionGenerator: Record<Solution, string> = {
  [Solution.MWA]: '@modern-js/mwa-generator',
  [Solution.Module]: '@modern-js/module-generator',
};

export const ChangesetGenerator = '@modern-js/changeset-generator';
export const DependenceGenerator = '@modern-js/dependence-generator';
export const EntryGenerator = '@modern-js/entry-generator';
