export { default as SwcLoader } from './loader';
export { builderPluginSwc, PluginSwc } from './plugin';
export * from './binding';
export * from './config';

/// NOTE:
/// Polyfill async function or generator, should install regenerator-runtime manually
