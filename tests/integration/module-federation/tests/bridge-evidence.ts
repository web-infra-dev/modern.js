import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Instrument only the temporary fixture. These markers observe evaluation,
// without changing module identities, resolution, or the MF caches.
export async function instrumentBridgeInputs(workspace: string) {
  const mark = (kind: string, name: string) => `
if (typeof window === 'undefined') {
  console.info('[BRIDGE_EVALUATED:${kind}:${name}]')
} else {
  ((globalThis as any).__bridgeEvaluations ||= []).push('${kind}:${name}')
}
`;
  for (const [name, route] of [
    ['CurrentWeather', 'current'],
    ['WeatherForecast', 'forecast'],
    ['AirQuality', 'air'],
  ]) {
    for (const [kind, filename] of [
      ['export', `provider/src/exports/${name}App.tsx`],
      ['page', `provider/src/routes/weather/${route}/page.tsx`],
    ]) {
      const target = path.join(workspace, filename);
      await writeFile(
        target,
        mark(kind, name) + (await readFile(target, 'utf8')),
      );
    }
  }
  const page = path.join(workspace, 'host/src/routes/bridge-inputs/page.tsx');
  await writeFile(
    page,
    (await readFile(page, 'utf8'))
      .replace(
        'forms.map(({ name, remote, Factory })',
        "forms.filter(({ name }) => !params.has('only') || params.get('only') === name).map(({ name, remote, Factory })",
      )
      .replace(
        '<ClientOnly label="Travel air quality" />',
        '{!params.has(\'only\') && <ClientOnly label="Travel air quality" />}',
      ),
  );
  const config = path.join(workspace, 'host/modern.config.ts');
  await writeFile(
    config,
    (await readFile(config, 'utf8')).replace(
      'performance: {',
      `tools: {
      rspack: (config, { rspack }) => {
        config.plugins ||= []
        config.plugins.push({
          apply(compiler: InstanceType<typeof rspack.Compiler>) {
            compiler.hooks.thisCompilation.tap('BridgeInputEvidence', compilation => {
              let graph: { roots: string[]; reachable: string[]; remotes: { id: string; issuers: string[] }[] }
              compilation.hooks.finishModules.tap('BridgeInputEvidence', modules => {
                const roots = [...modules].filter(module => /src[/\\\\\\\\]routes[/\\\\\\\\]bridge-inputs[/\\\\\\\\]page.tsx$/.test(module.identifier()))
                const visited = new Set<(typeof roots)[number]>()
                const visit = (module: (typeof roots)[number]) => {
                  if (visited.has(module)) return
                  visited.add(module)
                  for (const connection of compilation.moduleGraph.getOutgoingConnections(module))
                    if (connection.module) visit(connection.module)
                }
                roots.forEach(visit)
                graph = {
                  roots: roots.map(module => module.identifier()),
                  reachable: [...visited].map(module => module.identifier()),
                  remotes: [...modules].filter(module => module.type === 'remote-module').map(module => ({
                    id: module.identifier(),
                    issuers: [...compilation.moduleGraph.getIncomingConnections(module)].flatMap(connection => connection.originModule ? [connection.originModule.identifier()] : [])
                  }))
                }
              })
              compilation.hooks.processAssets.tap({
                name: 'BridgeInputEvidence',
                stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
              }, () => {
                compilation.emitAsset('static/bridge-input-graph.json', new rspack.sources.RawSource(JSON.stringify(graph)))
              })
            })
          }
        })
      }
    },
    performance: {`,
    ),
  );
}
