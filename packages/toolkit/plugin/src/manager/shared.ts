import { dagSort } from '@modern-js/utils';
import type { AsyncPlugin } from './async';
import type { Plugin } from './sync';

export const checkPlugins = <Hooks, API>(
  plugins: Plugin<Hooks, API>[] | AsyncPlugin<Hooks, API>[],
) => {
  plugins.forEach(origin => {
    origin.rivals.forEach(rival => {
      plugins.forEach(plugin => {
        if (rival === plugin.name) {
          throw new Error(`${origin.name} has rival ${plugin.name}`);
        }
      });
    });

    origin.required.forEach(required => {
      if (!plugins.some(plugin => plugin.name === required)) {
        throw new Error(
          `The plugin: ${required} is required when plugin: ${origin.name} is exist.`,
        );
      }
    });
  });
};

export function sortPlugins<Hooks, API>(
  input: Plugin<Hooks, API>[],
): Plugin<Hooks, API>[];
export function sortPlugins<Hooks, API>(
  input: AsyncPlugin<Hooks, API>[],
): AsyncPlugin<Hooks, API>[];
export function sortPlugins(
  input: Array<Plugin<unknown, unknown> | AsyncPlugin<unknown, unknown>>,
) {
  const plugins = input.slice();

  return dagSort(plugins);
}

export const includePlugin = <
  P extends { name: string },
  I extends { name: string },
>(
  plugins: P[],
  input: I,
): boolean => plugins.some(plugin => plugin.name === input.name);

export const isObject = (obj: unknown): obj is Record<string, any> =>
  obj !== null && typeof obj === 'object';

export const hasOwnProperty = <
  X extends Record<string, unknown>,
  Y extends PropertyKey,
>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> => obj.hasOwnProperty(prop);
