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
  let plugins = input.slice();

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];

    for (const pre of plugin.pre) {
      for (let j = i + 1; j < plugins.length; j++) {
        if (plugins[j].name === pre) {
          plugins = [
            ...plugins.slice(0, i),
            plugins[j],
            ...plugins.slice(i, j),
            ...plugins.slice(j + 1, plugins.length),
          ];
        }
      }
    }

    for (const post of plugin.post) {
      for (let j = 0; j < i; j++) {
        if (plugins[j].name === post) {
          plugins = [
            ...plugins.slice(0, j),
            ...plugins.slice(j + 1, i + 1),
            plugins[j],
            ...plugins.slice(i + 1, plugins.length),
          ];
        }
      }
    }
  }

  return plugins;
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
