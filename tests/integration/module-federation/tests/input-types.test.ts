import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp,
  mkdir,
  writeFile,
  symlink,
  rm,
  readFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

function packageFile(require: NodeJS.Require, name: string) {
  let directory = path.dirname(require.resolve(name));
  for (;;) {
    const filename = path.join(directory, 'package.json');
    if (
      existsSync(filename) &&
      JSON.parse(readFileSync(filename, 'utf8')).name === name
    )
      return filename;
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error(`Cannot locate ${name}`);
    directory = parent;
  }
}

const exec = promisify(execFile);
const hostRequire = createRequire(
  path.resolve(__dirname, '../host/package.json'),
);
const runtimeRequire = createRequire(
  packageFile(hostRequire, '@modern-js/runtime'),
);
const enhancedRequire = createRequire(
  packageFile(hostRequire, '@module-federation/enhanced'),
);

it.each(['module', 'commonjs'])(
  'preserves Modern consumer inference with generated MF mappings in %s',
  async mode => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'modern-mf-input-types-'),
    );
    try {
      const link = async (name: string, source: string) => {
        const destination = path.join(directory, 'node_modules', name);
        await mkdir(path.dirname(destination), { recursive: true });
        await symlink(path.dirname(source), destination, 'dir');
      };
      for (const name of [
        '@modern-js/runtime',
        '@module-federation/enhanced',
        'react',
      ])
        await link(name, packageFile(hostRequire, name));
      for (const name of ['react', 'react-dom', 'node'])
        await link(
          `@types/${name}`,
          runtimeRequire.resolve(`@types/${name}/package.json`),
        );
      // Use the installed producer API generator and consumer merger rather than a hand-written registry.
      const {
        DTSManager,
        retrieveHostConfig,
        REMOTE_ALIAS_IDENTIFIER,
        HOST_API_TYPES_FILE_NAME,
      } = enhancedRequire('@module-federation/dts-plugin/core');
      const manager = new DTSManager({});
      const { hostOptions } = retrieveHostConfig({
        context: directory,
        typesFolder: '@mf-types',
        moduleFederationConfig: { name: 'host', remotes: {} },
      });
      await mkdir(path.join(directory, '@mf-types', 'shop'), {
        recursive: true,
      });
      await writeFile(
        path.join(directory, '@mf-types', 'shop', 'apis.d.ts'),
        manager
          .generateAPITypes({
            './Card': './Card.tsx',
            './Bridge': './Bridge.tsx',
          })
          .replaceAll(REMOTE_ALIAS_IDENTIFIER, 'shop'),
      );
      manager.loadedRemoteAPIAlias.add('shop');
      manager.consumeAPITypes(hostOptions);
      expect(
        await readFile(
          path.join(directory, '@mf-types', HOST_API_TYPES_FILE_NAME),
          'utf8',
        ),
      ).toContain('RemoteModuleMap');
      await writeFile(
        path.join(directory, 'remote.d.ts'),
        `
declare module 'shop/Card' {
  import type { ComponentType } from 'react';
  const Card: ComponentType<{ label: string; count?: number }>;
  export default Card;
  export const Badge: ComponentType<{ tone: 'good' | 'bad' }>;
  export const metadata: string;
}
declare module 'shop/Bridge' {
  import type { BridgeProvider } from '@modern-js/runtime/mf';
  const App: BridgeProvider<{ station: string }>;
  export default App;
}
`,
      );
      await writeFile(
        path.join(directory, 'consumer.tsx'),
        `
import React from 'react';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { createBridgeComponent, createReactRemote, createModernReactRemote, ReactRemote, type CreateReactRemoteOptions } from '@modern-js/runtime/mf';
import Shop, * as ShopModule from 'shop/Card';
import Bridge from 'shop/Bridge';
const Literal = createReactRemote({ remote: 'shop/Card' });
const Routed = createModernReactRemote({ remote: 'shop/Card' });
const Loaded = createReactRemote({ remote: () => loadRemote('shop/Card') });
const Namespace = createModernReactRemote({ remote: () => ShopModule });
const Default = createReactRemote({ remote: async () => Shop });
const Named = createModernReactRemote({ remote: async () => ShopModule, exportName: 'Badge' });
const App = createModernReactRemote({ remote: () => Bridge });
const Producer = createBridgeComponent({
  rootComponent: ({ station }: { station: string }) => <p>{station}</p>,
});
const InferredProducer = createModernReactRemote({ remote: () => Producer });
<InferredProducer station="lakeside" />;
// @ts-expect-error Modern's producer factory must preserve business props
<InferredProducer station={42} />;
// @ts-expect-error Modern's producer factory must retain required props
<ReactRemote remote={() => Producer} />;
<Literal label="weather" />;
<Routed label="weather" count={1} />;
<Loaded label="weather" />;
<Namespace label="weather" />;
<Default label="weather" />;
<Named tone="good" />;
<App station="lakeside" />;
<ReactRemote remote="shop/Card" props={{ label: 'weather' }} />;
<ReactRemote remote={() => ShopModule} exportName="Badge" props={{ tone: 'bad' }} />;
<ReactRemote remote={async () => Shop} props={{ label: 'weather' }} />;
// @ts-expect-error literal inference must reject wrong props
<Literal label={42} />;
// @ts-expect-error Modern route wrapper must retain required props
<Routed />;
// @ts-expect-error generated loadRemote return types must reach the factory
<Loaded label={false} />;
// @ts-expect-error namespace inference must reject wrong props
<Namespace label={42} />;
// @ts-expect-error default-export inference must reject missing props
<Default />;
// @ts-expect-error named exports retain their own props
<Named tone="unknown" />;
// @ts-expect-error Bridge provider props survive the Modern wrapper
<App station={1} />;
// @ts-expect-error declarative literal props are checked
<ReactRemote remote="shop/Card" props={{ label: 42 }} />;
// @ts-expect-error required declarative props cannot be omitted
<ReactRemote remote={() => ShopModule} />;
// @ts-expect-error non-component exports cannot be selected
createReactRemote({ remote: 'shop/Card', exportName: 'metadata' });
// @ts-expect-error unknown exports cannot fall through to a permissive overload
createModernReactRemote({ remote: () => ShopModule, exportName: 'missing' });
// @ts-expect-error declarative named props are checked
<ReactRemote remote={() => ShopModule} exportName="Badge" props={{ tone: 'unknown' }} />;
declare const dynamicId: string;
const Explicit = createReactRemote<{ label: string }>({ remote: dynamicId });
const ExplicitRouted = createModernReactRemote<{ label: string }>({ remote: dynamicId });
<Explicit label="weather" />;
<ExplicitRouted label="weather" />;
<ReactRemote<{ label: string }> remote={dynamicId} props={{ label: 'weather' }} />;
// @ts-expect-error explicit business generics remain checked
<Explicit label={false} />;
// @ts-expect-error explicit Modern route generics remain checked
<ExplicitRouted label={false} />;

// Match the existing Weather failure wrapper, including the wide optional exportName.
type Options = Omit<CreateReactRemoteOptions, 'remote' | 'fallback'>;
function labComponent<P extends object = Record<string, unknown>>(
  options: Options,
  remote: string,
) {
  return function LabRemote(props: P) {
    const Card = React.useMemo(() =>
      createReactRemote<P & { labFailure?: string; labRun?: string }>({
        ...options,
        remote,
        dataFetchParams: {
          isDowngrade: false,
          ...options.dataFetchParams,
          labFailure: 'network',
        },
        fallback: ({ error }) => <p>{error.message}</p>,
      }), [remote]);
    const RoutedCard = React.useMemo(() =>
      createModernReactRemote<P & { labFailure?: string; labRun?: string }>({
        ...options,
        remote,
        dataFetchParams: {
          isDowngrade: false,
          ...options.dataFetchParams,
          labFailure: 'network',
        },
        fallback: ({ error }) => <p>{error.message}</p>,
      }), [remote]);
    return <>
      <Card {...props} labFailure="network" labRun="0" />
      <RoutedCard {...props} labFailure="network" labRun="0" />
    </>;
  };
}
const Wrapped = labComponent<{ label: string }>({ exportName: 'Weather' }, dynamicId);
<Wrapped label="weather" />;
// @ts-expect-error spreading wide options must not erase the wrapper's business props
<Wrapped label={42} />;
// @ts-expect-error required props survive generic wrappers
<Wrapped />;
const DefaultWrapped = labComponent({ exportName: 'Weather' }, dynamicId);
<DefaultWrapped arbitrary="weather" />;
declare const fullOptions: CreateReactRemoteOptions;
function declarativeWrapper<P extends object>(props: P) {
  return <ReactRemote<P> {...fullOptions} props={props} />;
}
<ReactRemote<{ label: string }> {...fullOptions} props={{ label: 'weather' }} />;
// @ts-expect-error wide exportName does not weaken explicit declarative props
<ReactRemote<{ label: string }> {...fullOptions} props={{ label: 42 }} />;
// @ts-expect-error explicit declarative required props remain required after spread
<ReactRemote<{ label: string }> {...fullOptions} />;
`,
      );
      await writeFile(
        path.join(directory, 'package.json'),
        JSON.stringify({ type: mode }),
      );
      await writeFile(
        path.join(directory, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            skipLibCheck: false,
            noEmit: true,
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            jsx: 'react-jsx',
            esModuleInterop: true,
            types: ['node', 'react'],
          },
          include: ['consumer.tsx', 'remote.d.ts', '@mf-types/**/*.d.ts'],
        }),
      );
      const result = await exec(
        process.execPath,
        [
          runtimeRequire.resolve('typescript/bin/tsc'),
          '-p',
          path.join(directory, 'tsconfig.json'),
        ],
        { cwd: directory, timeout: 60000, maxBuffer: 2 * 1024 * 1024 },
      );
      expect(result.stdout + result.stderr).toBe('');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
