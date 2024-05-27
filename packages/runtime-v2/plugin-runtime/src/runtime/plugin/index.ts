// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RuntimeConfig {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CLIRuntimeConfig {}
export function registerPlugin(runtimeConfig: RuntimeConfig) {
  console.log('registerPlugin', runtimeConfig);
}

export function mergeRuntimeConfig(
  runtimeConfig: RuntimeConfig,
  _CLIRuntimeConfig: CLIRuntimeConfig,
) {
  return runtimeConfig;
}
