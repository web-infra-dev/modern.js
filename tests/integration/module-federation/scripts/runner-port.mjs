/** @returns {import('@rstest/core').RsbuildPlugin[]} */
export function runnerPortPlugins() {
  if (!process.env.MF_LAB_RUNNER_PORT) return [];
  const port = Number(process.env.MF_LAB_RUNNER_PORT);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error('MF_LAB_RUNNER_PORT must be a valid port');
  return [
    {
      name: 'weather-lab-runner-port',
      setup(api) {
        api.modifyRsbuildConfig(config => {
          config.server ??= {};
          config.server.port = port;
          config.server.strictPort = true;
        });
      },
    },
  ];
}
