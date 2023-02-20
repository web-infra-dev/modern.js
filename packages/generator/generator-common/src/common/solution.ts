import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Solution {
  MWA = 'mwa',
  Module = 'module',
  Monorepo = 'monorepo',
}

export enum SubSolution {
  MWA = 'mwa',
  MWATest = 'mwa_test',
  Module = 'module',
  InnerModule = 'inner_module',
}

export const SolutionText: Record<Solution, () => string> = {
  [Solution.MWA]: () => i18n.t(localeKeys.solution.mwa),
  [Solution.Module]: () => i18n.t(localeKeys.solution.module),
  [Solution.Monorepo]: () => i18n.t(localeKeys.solution.monorepo),
};

export const SubSolutionText: Record<SubSolution, () => string> = {
  [SubSolution.MWA]: () => i18n.t(localeKeys.sub_solution.mwa),
  [SubSolution.MWATest]: () => i18n.t(localeKeys.sub_solution.mwa_test),
  [SubSolution.Module]: () => i18n.t(localeKeys.sub_solution.module),
  [SubSolution.InnerModule]: () => i18n.t(localeKeys.sub_solution.inner_module),
};

export const SolutionToolsMap: Record<Solution, string> = {
  [Solution.MWA]: '@modern-js/app-tools',
  [Solution.Module]: '@modern-js/module-tools',
  [Solution.Monorepo]: '@modern-js/monorepo-tools',
};

export function getSolutionNameFromSubSolution(solution: SubSolution) {
  if (solution === SubSolution.MWATest) {
    return Solution.MWA;
  }
  if (solution === SubSolution.InnerModule) {
    return Solution.Module;
  }
  return solution;
}

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
          const items = (
            extra?.solutions ||
            Object.values(extra?.isMonorepo ? SubSolution : Solution)
          )
            .filter(
              (solution: Solution) =>
                !(extra?.isSubProject && solution === Solution.Monorepo),
            )
            .map((solution: unknown) => ({
              value: solution,
              label: extra?.isMonorepo
                ? SubSolutionText[solution as SubSolution]()
                : SolutionText[solution as Solution](),
            }));
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
    extra.customPlugin[
      extra?.isMonorepoSubProject
        ? getSolutionNameFromSubSolution(extra?.solution)
        : extra?.solution
    ] &&
    extra.customPlugin[
      extra?.isMonorepoSubProject
        ? getSolutionNameFromSubSolution(extra?.solution)
        : extra?.solution
    ].length > 0;
  return {
    type: 'object',
    properties: hasPlugin
      ? {
          scenes: {
            type: 'string',
            title: i18n.t(localeKeys.scenes.self),
            enum: (() => {
              const solution = extra?.isMonorepoSubProject
                ? getSolutionNameFromSubSolution(extra?.solution)
                : extra?.solution;
              const items = (
                extra?.customPlugin ? extra?.customPlugin[solution] || [] : []
              ).map((plugin: any) => ({
                value: plugin.key,
                label: plugin.name,
              }));
              if (solution && solution !== 'custom') {
                items.unshift({
                  value: solution,
                  label: `${
                    extra?.isMonorepoSubProject
                      ? SubSolutionText[solution as SubSolution]()
                      : SolutionText[solution as Solution]()
                  }(${i18n.t(localeKeys.solution.default)})`,
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
export const RspackGenerator = '@modern-js/rspack-generator';

export const SolutionGenerator: Record<Solution, string> = {
  [Solution.MWA]: '@modern-js/mwa-generator',
  [Solution.Module]: '@modern-js/module-generator',
  [Solution.Monorepo]: '@modern-js/monorepo-generator',
};

export const SubSolutionGenerator: Record<SubSolution, string> = {
  [SubSolution.MWA]: '@modern-js/mwa-generator',
  [SubSolution.MWATest]: '@modern-js/mwa-generator',
  [SubSolution.Module]: '@modern-js/module-generator',
  [SubSolution.InnerModule]: '@modern-js/module-generator',
};

export const ChangesetGenerator = '@modern-js/changeset-generator';
export const DependenceGenerator = '@modern-js/dependence-generator';
export const EntryGenerator = '@modern-js/entry-generator';
