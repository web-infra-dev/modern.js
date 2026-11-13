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
  if (!['ordinary', 'bridge', 'service', 'service-csr'].includes(mode))
    throw new Error(`Unknown mode: ${mode}`);
  const service = mode.startsWith('service');
  const ordinary = mode === 'ordinary';
  const modeKey = mode.replaceAll('-', '_');
  const appTools = modernPackage('@modern-js/app-tools');
  const runtime = modernPackage('@modern-js/runtime');
  const react = resolvePackageRoot('react');
  const reactDOM = resolvePackageRoot('react-dom');
  const providerURL = `http://localhost:${ports.provider}`;
  const hostURL = `http://localhost:${ports.host}`;
  const manifestURL = `http://localhost:${ports.manifest}/static/mf-manifest.json`;
  for (const app of ports.middle
    ? ['provider', 'middle', 'host']
    : ['provider', 'host']) {
    const directory = path.join(root, app);
    await fs.mkdir(path.join(directory, 'src/routes'), {
      recursive: true,
    });
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
    const middle = app === 'middle';
    const origin = `http://localhost:${ports[app]}`;
    const upstream =
      ports.middle && app === 'host'
        ? `dev_update_${modeKey}_middle@http://localhost:${ports.middle}/static/mf-manifest.json`
        : `dev_update_${modeKey}_provider@${manifestURL}`;
    const federation = {
      name: `dev_update_${modeKey}_${app}`,
      dts: false,
      filename: 'static/remoteEntry.js',
      manifest: { filePath: 'static' },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
      ...(provider
        ? {
            exposes: {
              './App': './src/Remote.tsx',
              ...(ordinary
                ? { './Loader': './src/routes/remote/page.data.ts' }
                : {}),
            },
          }
        : {
            remotes: {
              remote: upstream,
            },
            ...(middle
              ? {
                  exposes: {
                    './App': './src/Remote.tsx',
                    './Loader': './src/routes/page.data.ts',
                  },
                }
              : {}),
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
        : ordinary
          ? `
import Remote from 'remote/App';
import { useLoaderData } from '@modern-js/runtime/router';
export default function Host() {
  const data = useLoaderData() as {version: string};
  return <main><h1>Automatic ordinary development update</h1><Remote data={data}/></main>;
}
`
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
  if (ordinary) {
    for (const app of ports.middle ? ['host', 'middle'] : ['host'])
      await fs.writeFile(
        path.join(root, app, 'src/routes/page.data.ts'),
        `import {loader as remoteLoader} from 'remote/Loader'; export const loader = async (...args: any[]) => remoteLoader(...args);\n`,
      );
    if (ports.middle)
      await fs.writeFile(
        path.join(root, 'middle/src/Remote.tsx'),
        `export {default} from 'remote/App';\n`,
      );
  }
  const route = path.join(root, 'provider/src/routes/remote');
  await fs.mkdir(route, { recursive: true });
  await fs.writeFile(
    path.join(root, 'provider/src/Remote.tsx'),
    ordinary
      ? `export {default} from './routes/remote/page';\n`
      : `
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
${ordinary ? '' : "import {useLoaderData} from '@modern-js/runtime/router';"}
import {version} from './version';
import './remote.css';
declare const FEDERATION_BUILD_IDENTIFIER: string;
declare const __webpack_require__: {federation: {instance: {options: {id: string}}}};
export default function Remote(${ordinary ? '{data}: {data: {version: string}}' : ''}) {
  ${ordinary ? '' : 'const data = useLoaderData() as {version: string};'}
  const [count, setCount] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const identity = useRef<HTMLOutputElement>(null);
  const [runtimeId, setRuntimeId] = useState('');
  useEffect(() => {
    button.current!.dataset.hydrated = 'true';
    identity.current!.dataset.buildId = FEDERATION_BUILD_IDENTIFIER;
    setRuntimeId(__webpack_require__.federation.instance.options.id);
  }, []);
  return <section data-testid="dev-remote" data-ui={version} data-loader={data.version}
    data-runtime-id={runtimeId}>
    {/* This diagnostic marker intentionally differs between Node and browser compilations. */}
    <output ref={identity} hidden suppressHydrationWarning data-build-id={FEDERATION_BUILD_IDENTIFIER} />
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
