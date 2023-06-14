export { default as SwcLoader } from './loader';
export { builderPluginSwc, PluginSwc } from './plugin';
export * from './binding';
export * from './types';

/// NOTE:
/// Polyfill async function or generator, should install regenerator-runtime manually
