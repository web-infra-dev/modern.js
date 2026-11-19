import fs from 'node:fs/promises';
import path from 'node:path';
import { buildApp } from './build.mjs';
import {
  appTools,
  react,
  reactDOM,
  prepareApp,
  linkDependencies,
} from './fixture-app.mjs';
export async function buildProductionFixture({
  root,
  assetURL,
  manifestURL = undefined,
  formalAPI = false,
  identity = false,
  asyncStartup,
}) {
  for (const app of ['remote', 'host']) {
    const dir = path.join(root, app);
    await prepareApp(dir, `r6-${app}`);
    const config =
      app === 'remote'
        ? {
            name: 'r6_remote',
            filename: 'remoteEntry.js',
            dts: false,
            exposes: { './Counter': './src/Counter.tsx' },
            shared: {
              react: { singleton: true },
              'react-dom': { singleton: true },
            },
          }
        : {
            name: 'r6_host',
            dts: false,
            remotes: {
              remote: `r6_remote@${manifestURL || `${assetURL}/v1/mf-manifest.json`}`,
            },
            shared: {
              react: { singleton: true },
              'react-dom': { singleton: true },
            },
          };
    if (asyncStartup !== undefined) config.experiments = { asyncStartup };
    await fs.writeFile(
      path.join(dir, 'modern.config.ts'),
      `import {appTools,defineConfig} from '@modern-js/app-tools'; export default defineConfig({output:{disableTsChecker:true,${app === 'remote' ? `assetPrefix:'${assetURL}/v1/',` : ''}},source:{alias:{react:${JSON.stringify(react)}, 'react-dom':${JSON.stringify(reactDOM)}}},server:{ssr:{mode:'stream'}},plugins:[appTools()],moduleFederation:{ssr:{cacheUpdates:true},config:${JSON.stringify(config)}}});`,
    );
    await fs.writeFile(
      path.join(dir, 'src/routes/page.tsx'),
      app === 'remote'
        ? `export default () => <p>provider</p>;`
        : `import Counter from 'remote/Counter'; import {Suspense,use} from 'react'; function Held(){if(typeof document==='undefined' && globalThis.__r6Stream){globalThis.__r6Stream.started();use(globalThis.__r6Stream.promise);} return <span>stream complete</span>;} export default () => <main><h1>SSR release</h1><Counter /><Suspense fallback={<span>stream pending</span>}><Held /></Suspense></main>;`,
    );
    if (app === 'host') {
      await fs.writeFile(
        path.join(dir, 'src/routes/page.data.ts'),
        `${formalAPI ? `import {shouldUpdateRemote,updateRemotes} from '@modern-js/runtime/mf'; globalThis.__r6FormalMF = {shouldUpdateRemote,updateRemotes};` : ''} export const loader = async ({request}) => {await globalThis.__r6Loader?.(request);return {data:'loader-ready'}}; export const action=async({request})=>{globalThis.__r6Actions=(globalThis.__r6Actions||0)+1;return {action:await request.text()}};`,
      );
      // This route can boot from a CSR shell without a gated server loader.
      // Keep the index route's real loader for drain/deferred-update coverage.
      await fs.mkdir(path.join(dir, 'src/routes/client'), { recursive: true });
      await fs.writeFile(
        path.join(dir, 'src/routes/client/page.tsx'),
        `import Counter from 'remote/Counter'; export default () => <main><h1>Client-ready counter</h1><Counter /></main>;`,
      );
    }
    if (app === 'remote')
      await fs.writeFile(
        path.join(dir, 'src/Counter.tsx'),
        `import {useState,useEffect} from 'react'; export const release='v1'; export default function Counter(){const [n,set]=useState(0); useEffect(()=>{document.getElementById("remote-counter").dataset.hydrated="true"},[]); return <button id="remote-counter" onClick={()=>set(n+1)}>v1:{n}</button>}`,
      );
    const result = await buildApp(
      process.execPath,
      [path.join(appTools, 'bin/modern.js'), 'build'],
      {
        cwd: dir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          MF_BUILD_VERSION: app === 'remote' ? 'v1' : 'host-a',
          TS_NODE_COMPILER: 'typescript-compiler',
        },
        stdio: 'inherit',
      },
    );
    if (result.status !== 0)
      throw new Error(`Modern build failed: ${result.status ?? result.signal}`);
  }
  const dir = path.join(root, 'remote');
  await fs.mkdir(path.join(root, 'releases'), { recursive: true });
  await fs.cp(path.join(dir, 'dist'), path.join(root, 'releases/v1'), {
    recursive: true,
  });
  for (const file of ['modern.config.ts', 'src/Counter.tsx']) {
    const text = await fs.readFile(path.join(dir, file), 'utf8');
    await fs.writeFile(path.join(dir, file), text.replaceAll('v1', 'v2'));
  }
  const result = await buildApp(
    process.execPath,
    [path.join(appTools, 'bin/modern.js'), 'build'],
    {
      cwd: dir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        MF_BUILD_VERSION: 'v2',
      },
      stdio: 'inherit',
    },
  );
  if (result.status !== 0)
    throw new Error(
      `Provider v2 build failed: ${result.status ?? result.signal}`,
    );
  await fs.cp(path.join(dir, 'dist'), path.join(root, 'releases/v2'), {
    recursive: true,
  });
  if (identity) {
    const host = path.join(root, 'host');
    const secondHost = path.join(root, 'host-b');
    await fs.mkdir(secondHost, { recursive: true });
    await fs.cp(path.join(host, 'src'), path.join(secondHost, 'src'), {
      recursive: true,
    });
    for (const file of ['package.json', 'tsconfig.json'])
      await fs.copyFile(path.join(host, file), path.join(secondHost, file));
    await linkDependencies(secondHost);
    const config = await fs.readFile(
      path.join(host, 'modern.config.ts'),
      'utf8',
    );
    await fs.writeFile(
      path.join(secondHost, 'modern.config.ts'),
      config
        .replace('"name":"r6_host"', '"name":"r6_host_b"')
        .replaceAll(
          `${assetURL}/v1/mf-manifest.json`,
          `${assetURL}/v2/mf-manifest.json`,
        ),
    );
    const build = await buildApp(
      process.execPath,
      [path.join(appTools, 'bin/modern.js'), 'build'],
      {
        cwd: secondHost,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          MF_BUILD_VERSION: 'host-b',
        },
        stdio: 'inherit',
      },
    );
    if (build.status !== 0)
      throw new Error(
        `Second host build failed: ${build.status ?? build.signal}`,
      );
  }
}
