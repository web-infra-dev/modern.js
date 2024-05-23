// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RuntimeConfig {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CLIRuntimeConfig {}
export function registerPlugin(
  runtimeConfig: RuntimeConfig,
  cliRuntimeConfig: CLIRuntimeConfig,
) {
  console.log('registerPlugin', runtimeConfig, cliRuntimeConfig);
}
