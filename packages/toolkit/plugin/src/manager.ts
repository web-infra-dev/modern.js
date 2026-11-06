/**
 * NOTE: This file will be used in both Node.js and runtime environments. Please avoid importing Node.js-specific APIs.
 */
import type { Plugin, PluginManager } from './types/plugin';
import type { Falsy, MaybePromise } from './types/utils';

const isFunction = (obj: ((api: {}) => MaybePromise<void>) | undefined) =>
  typeof obj === 'function';
// Validates if the plugin is a valid plugin instance
function validatePlugin(plugin: unknown) {
  const type = typeof plugin;

  if (type !== 'object' || plugin === null) {
    throw new Error(
      `Expect CLI Plugin instance to be an object, but got ${type}.`,
    );
  }

  if (!(plugin as Plugin).setup) return;

  if (isFunction((plugin as Plugin).setup)) {
    return;
  }

  throw new Error(
    `Expect CLI Plugin plugin.setup to be a function, but got ${type}.`,
  );
}

export function createPluginManager(): PluginManager {
  const plugins = new Map<string, Plugin>();
  // A boolean distinguishes usePlugins from explicit prerequisites without
  // allocating a second object for each dependency edge.
  const dependencies = new Map<
    string,
    { pre: Map<string, boolean>; post: Set<string> }
  >();
  const dependency = (name: string) => {
    let value = dependencies.get(name);
    if (!value) {
      value = { pre: new Map(), post: new Set() };
      dependencies.set(name, value);
    }
    return value;
  };
  const addPlugin = (plugin: Plugin | Falsy) => {
    if (!plugin) return;
    validatePlugin(plugin);
    const { name, pre = [], post = [], usePlugins = [] } = plugin;
    if (plugins.has(name)) {
      console.warn(`Plugin ${name} already exists.`);
      return;
    }
    plugins.set(name, plugin);
    const edges = { pre: new Map<string, boolean>(), post: new Set<string>() };
    dependencies.set(name, edges);
    for (const name of pre) {
      dependency(name);
      edges.pre.set(name, false);
    }
    for (const name of post) {
      dependency(name);
      edges.post.add(name);
    }
    for (const child of usePlugins) {
      if (!plugins.has(child.name)) addPlugin(child);
      if (!edges.post.has(child.name) && !dependency(child.name).pre.has(name))
        edges.pre.set(child.name, true);
    }
  };
  const getPlugins = () => {
    for (const name of plugins.keys()) {
      for (const target of dependency(name).post) {
        const pre = dependency(target).pre;
        if (!pre.has(name)) pre.set(name, false);
      }
    }
    const state = new Map<string, number>();
    const result: Plugin[] = [];
    const visit = (name: string) => {
      const status = state.get(name);
      if (status === 0)
        throw new Error(`Circular dependency detected: ${name}`);
      const plugin = plugins.get(name);
      if (status === 1 || !plugin) return;
      state.set(name, 0);
      for (const required of plugin.required || []) {
        if (!plugins.has(required))
          throw new Error(
            `${name} plugin required plugin ${required}, but not found.`,
          );
      }
      const pre = dependency(name).pre;
      // Explicit prerequisites precede usePlugins in their insertion order.
      for (const [target, used] of pre) if (!used) visit(target);
      for (const [target, used] of pre) if (used) visit(target);
      state.set(name, 1);
      result.push(plugin);
    };
    for (const name of plugins.keys()) visit(name);
    return result;
  };
  return {
    getPlugins,
    addPlugins: values => {
      for (const value of values) addPlugin(value);
    },
    clear() {
      plugins.clear();
      dependencies.clear();
    },
    isPluginExists: name => plugins.has(name),
  };
}
