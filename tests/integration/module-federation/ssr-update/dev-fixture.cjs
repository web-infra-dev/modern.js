const fs = require('node:fs/promises');
const path = require('node:path');
const { modernPackage, resolvePackageRoot } = require('./packages.cjs');

const colors = {
  first: 'rgb(20, 80, 140)',
  second: 'rgb(140, 40, 20)',
  css: 'rgb(30, 120, 50)',
};

async function writeGeneration(
  root,
  { ui = 'v1', loader = 'v1', color = colors.first } = {},
) {
  const route = path.join(root, 'provider/src/routes/remote');
  await fs.writeFile(
    path.join(route, 'version.ts'),
    `export const version = ${JSON.stringify(ui)};\n`,
  );
  await fs.writeFile(
    path.join(route, 'page.data.ts'),
    `export const loader = async () => ({version: ${JSON.stringify(loader)}});\n`,
  );
  await fs.writeFile(
    path.join(route, 'remote.css'),
    `[data-testid="dev-remote"] { color: ${color}; }\n`,
  );
}

async function createFixture(root, mode, ports) {
  if (!['bridge', 'service', 'service-csr'].includes(mode))
    throw new Error(`Unknown mode: ${mode}`);
  const service = mode.startsWith('service');
  const modeKey = mode.replaceAll('-', '_');
  const appTools = modernPackage('@modern-js/app-tools');
  const runtime = modernPackage('@modern-js/runtime');
  const react = resolvePackageRoot('react');
  const reactDOM = resolvePackageRoot('react-dom');
  const providerURL = `http://localhost:${ports.provider}`;
  const hostURL = `http://localhost:${ports.host}`;
  const manifestURL = `http://localhost:${ports.manifest}/static/mf-manifest.json`;
  for (const app of ['provider', 'host']) {
    const directory = path.join(root, app);
    await fs.mkdir(path.join(directory, 'src/routes'), { recursive: true });
    const modules = path.join(directory, 'node_modules');
    const packages = {
      '@modern-js/app-tools': appTools,
      '@modern-js/runtime': runtime,
      '@modern-js/plugin-module-federation': modernPackage(
        '@modern-js/plugin-module-federation',
      ),
      '@modern-js/tsconfig': modernPackage('@modern-js/tsconfig'),
      '@module-federation/enhanced': resolvePackageRoot(
        '@module-federation/enhanced',
      ),
      react,
      'react-dom': reactDOM,
    };
    for (const [name, target] of Object.entries(packages)) {
      const destination = path.join(modules, name);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.symlink(target, destination);
    }
    await fs.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify(
        {
          name: `dev-update-${mode}-${app}`,
          private: true,
          dependencies: Object.fromEntries(
            await Promise.all(
              Object.entries(packages).map(async ([name, target]) => [
                name,
                JSON.parse(
                  await fs.readFile(path.join(target, 'package.json'), 'utf8'),
                ).version,
              ]),
            ),
          ),
        },
        null,
        2,
      ),
    );
    await fs.writeFile(
      path.join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { jsx: 'react-jsx' },
        exclude: ['node_modules', 'dist'],
      }),
    );
    const provider = app === 'provider';
    const origin = provider ? providerURL : hostURL;
    const federation = {
      name: `dev_update_${modeKey}_${app}`,
      dts: false,
      filename: 'static/remoteEntry.js',
      manifest: { filePath: 'static' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
      ...(provider
        ? { exposes: { './App': './src/Remote.tsx' } }
        : {
            remotes: {
              remote: `dev_update_${modeKey}_provider@${manifestURL}`,
            },
          }),
    };
    await fs.writeFile(
      path.join(directory, 'modern.config.ts'),
      `
import { appTools, defineConfig } from '@modern-js/app-tools';
export default defineConfig({
  server: { port: ${ports[app]}, ssr: ${!provider && mode === 'service-csr' ? 'false' : "{ mode: 'stream' }"} },
  output: { disableTsChecker: true, assetPrefix: ${JSON.stringify(origin + '/')} },
  dev: { assetPrefix: ${JSON.stringify(origin + '/')}, lazyCompilation: false },
  performance: { buildCache: false },
  source: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDOM)} } },
  plugins: [appTools()],
  moduleFederation: {
    ssr: { cacheUpdates: true },
    ${provider && service ? `serviceProvider: { origin: ${JSON.stringify(providerURL)} },` : ''}
    config: ${JSON.stringify(federation)},
  },
});
`,
    );
    await fs.writeFile(
      path.join(directory, 'src/routes/layout.tsx'),
      `import {Outlet} from '@modern-js/runtime/router'; export default () => <Outlet/>;\n`,
    );
    await fs.writeFile(
      path.join(directory, 'src/routes/page.tsx'),
      provider
        ? `export default () => <p>Dev producer</p>;\n`
        : `
import { useState } from 'react';
import { useLocation } from '@modern-js/runtime/router';
import { ReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
const load = () => loadRemote('remote/App');
export default function Host() {
  const { search } = useLocation();
  const [mounted, setMounted] = useState(!new URLSearchParams(search).has('late'));
  return <main><h1>Automatic ${mode} development update</h1>
    <button id="dev-toggle" onClick={() => setMounted(value => !value)}>{mounted ? 'Disconnect' : 'Connect'}</button>
    {mounted && <ReactRemote remote={load} memoryRoute={{entryPath: '/'}}
      loading={<p>Loading remote</p>} fallback={({error}) => <p role="alert">{error.message}</p>} />}
  </main>;
}
`,
    );
  }
  const route = path.join(root, 'provider/src/routes/remote');
  await fs.mkdir(route, { recursive: true });
  await fs.writeFile(
    path.join(root, 'provider/src/Remote.tsx'),
    `
import '@modern-js/runtime/registry/index';
import {createRoot} from '@modern-js/runtime/react';
import {createModernBridgeComponent} from '@modern-js/runtime/mf';
const Root = createRoot({route: '/remote'});
export default createModernBridgeComponent({rootComponent: Root${service ? ', isService: true' : ''}});
`,
  );
  await fs.writeFile(
    path.join(route, 'page.tsx'),
    `
import {useEffect, useRef, useState} from 'react';
import {useLoaderData} from '@modern-js/runtime/router';
import {version} from './version';
import './remote.css';
export default function Remote() {
  const data = useLoaderData() as {version: string};
  const [count, setCount] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {button.current!.dataset.hydrated = 'true'}, []);
  return <section data-testid="dev-remote" data-ui={version} data-loader={data.version}>
    <h2>Remote UI {version}</h2><p>Remote loader {data.version}</p>
    <button ref={button} id="dev-counter" onClick={() => setCount(value => value + 1)}>count:{count}</button>
  </section>;
}
`,
  );
  await writeGeneration(root);
  return {
    appTools,
    hostURL,
    providerURL,
    manifestURL,
    providerName: `dev_update_${modeKey}_provider`,
    providerManifestURL: `${providerURL}/static/mf-manifest.json`,
  };
}

module.exports = { createFixture, writeGeneration, colors };
