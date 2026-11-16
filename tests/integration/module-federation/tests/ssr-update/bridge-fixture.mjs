import fs from 'node:fs/promises';
import path from 'node:path';
import { buildApp } from './build.mjs';
import { appTools, react, reactDOM, prepareApp } from './fixture-app.mjs';
export async function buildBridgeFixture({ root, assetURL }) {
  for (const app of ['remote', 'host']) {
    const dir = path.join(root, app);
    await prepareApp(dir, `bridge-update-${app}`);
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
    const result = await buildApp(
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
  const result = await buildApp(
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
}
