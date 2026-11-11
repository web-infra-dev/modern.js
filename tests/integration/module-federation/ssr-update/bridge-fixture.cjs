const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = process.env.SSR_CACHE_BRIDGE_DIR;
const { modernPackage, resolvePackageRoot } = require('./packages.cjs');
const appTools = modernPackage('@modern-js/app-tools');
const runtime = modernPackage('@modern-js/runtime');
const react = resolvePackageRoot('react');
const reactDOM = resolvePackageRoot('react-dom');
const assetURL = process.env.SSR_CACHE_BRIDGE_ASSET_URL;
if (!root || !assetURL) throw new Error('Run the cache-updates E2E entry');
(async () => {
  for (const app of ['remote', 'host']) {
    const dir = path.join(root, app);
    await fs.mkdir(path.join(dir, 'src/routes'), { recursive: true });
    const modules = path.join(dir, 'node_modules');
    if ((await fs.lstat(modules).catch(() => null))?.isSymbolicLink())
      await fs.unlink(modules);
    await fs.mkdir(modules, { recursive: true });
    const overrides = {
      '@modern-js/app-tools': appTools,
      '@modern-js/runtime': runtime,
      react,
      'react-dom': reactDOM,
    };
    for (const name of [
      '@modern-js/app-tools',
      '@modern-js/runtime',
      '@modern-js/plugin-module-federation',
      '@modern-js/tsconfig',
      '@module-federation/enhanced',
      'react',
      'react-dom',
    ]) {
      const target = path.join(modules, name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.symlink(overrides[name] || resolvePackageRoot(name), target);
    }
    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: `bridge-update-${app}`,
        private: true,
        dependencies: {
          react: JSON.parse(await fs.readFile(path.join(react, 'package.json')))
            .version,
          'react-dom': JSON.parse(
            await fs.readFile(path.join(reactDOM, 'package.json')),
          ).version,
          '@modern-js/runtime': JSON.parse(
            await fs.readFile(path.join(runtime, 'package.json')),
          ).version,
        },
      }),
    );
    await fs.writeFile(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { jsx: 'react-jsx' } }),
    );
    const config =
      app === 'remote'
        ? {
            name: 'bridge_update_remote',
            filename: 'remoteEntry.js',
            dts: false,
            exposes: { './App': './src/BridgeProvider.tsx' },
            shared: {
              react: { singleton: true },
              'react-dom': { singleton: true },
            },
          }
        : {
            name: 'bridge_update_host',
            dts: false,
            remotes: {
              remote: `bridge_update_remote@${assetURL}/v1/mf-manifest.json`,
            },
            shared: {
              react: { singleton: true },
              'react-dom': { singleton: true },
            },
          };
    await fs.writeFile(
      path.join(dir, 'modern.config.ts'),
      `import {appTools,defineConfig} from '@modern-js/app-tools'; export default defineConfig({output:{disableTsChecker:true,${app === 'remote' ? `assetPrefix:'${assetURL}/v1/',` : ''}},source:{alias:{react:${JSON.stringify(react)}, 'react-dom':${JSON.stringify(reactDOM)}}},server:{ssr:{mode:'stream'}},plugins:[appTools()],moduleFederation:{ssr:{cacheUpdates:true},config:${JSON.stringify(config)}}});`,
    );
    await fs.writeFile(
      path.join(dir, 'src/routes/layout.tsx'),
      `import {Outlet} from '@modern-js/runtime/router'; export default () => <Outlet/>;`,
    );
    await fs.writeFile(
      path.join(dir, 'src/routes/page.tsx'),
      app === 'remote'
        ? `export default () => <p>provider</p>;`
        : `import {ReactRemote} from '@modern-js/runtime/mf'; const loadApp=()=>import('remote/App'); export default ()=> <main><h1>Bridge SSR release</h1><ReactRemote remote={loadApp} memoryRoute={{entryPath:'/'}} /></main>;`,
    );
    if (app === 'remote') {
      await fs.mkdir(path.join(dir, 'src/routes/bridge'), { recursive: true });
      await fs.writeFile(
        path.join(dir, 'src/BridgeProvider.tsx'),
        `
import '@modern-js/runtime/registry/index';
import {createRoot} from '@modern-js/runtime/react';
import {createModernBridgeComponent} from '@modern-js/runtime/mf';
const Root=createRoot({route:'/bridge'});
if(typeof document==='undefined') (globalThis.__bridgeUpdateRoots ||= []).push({root:Root,version:'v1'});
export default createModernBridgeComponent({rootComponent:Root});
`,
      );
      await fs.writeFile(
        path.join(dir, 'src/routes/bridge/page.data.ts'),
        `
export const loader=async()=> {
  const gate=globalThis.__bridgeUpdateGate;
  if(gate){gate.entered(); await gate.promise; gate.completed();}
  return {version:'v1'};
};
`,
      );
      await fs.writeFile(
        path.join(dir, 'src/routes/bridge/page.tsx'),
        `
import {useEffect,useRef,useState} from 'react';
import {useLoaderData} from '@modern-js/runtime/router';
import {useRuntimeContext} from '@modern-js/runtime';
export default function BridgeApp(){
  const data=useLoaderData() as {version:string};
  const context=useRuntimeContext();
  if(typeof document==='undefined') (globalThis.__bridgeUpdateContexts ||= []).push({context,version:data.version});
  const [count,setCount]=useState(0);
  const button=useRef<HTMLButtonElement>(null);
  useEffect(()=>{button.current!.dataset.hydrated='true'},[]);
  return <section data-testid="bridge-update-app"><h2>Bridge v1</h2><button ref={button} id="bridge-update-counter" data-version={data.version} onClick={()=>setCount(count+1)}>{data.version}:{count}</button></section>;
}
`,
      );
    }
    const result = spawnSync(
      process.execPath,
      [path.join(appTools, 'bin/modern.js'), 'build'],
      {
        cwd: dir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
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
  for (const file of [
    'modern.config.ts',
    'src/BridgeProvider.tsx',
    'src/routes/bridge/page.tsx',
    'src/routes/bridge/page.data.ts',
  ]) {
    const text = await fs.readFile(path.join(dir, file), 'utf8');
    await fs.writeFile(path.join(dir, file), text.replaceAll('v1', 'v2'));
  }
  const result = spawnSync(
    process.execPath,
    [path.join(appTools, 'bin/modern.js'), 'build'],
    {
      cwd: dir,
      env: { ...process.env, NODE_ENV: 'production' },
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
})();
