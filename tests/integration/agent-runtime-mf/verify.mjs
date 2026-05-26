import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const cases = [
  ['react-multi-version', 'reactMultiVersionProvider', 4311, 4312],
  ['nested-router-tree', 'nestedRouterTreeProvider', 4321, 4322],
  ['async-chunk-runtime', 'asyncChunkRuntimeProvider', 4331, 4332],
  ['garfish-provider', 'garfishProvider', 4341, 4342],
  ['redirect-loader', 'redirectLoaderProvider', 4351, 4352],
  ['usenavigate-blank', 'useNavigateBlankProvider', 4361, 4362],
];

const expectedProviderExpose = {
  'react-multi-version': "'./RemotePanel'",
  'nested-router-tree': "'./RemotePanel'",
  'garfish-provider': "'./RemotePanel'",
  'redirect-loader': "'./RemotePanel'",
  'usenavigate-blank': "'./export-app'",
};

const read = file => readFileSync(file, 'utf8');

const assertFile = file => {
  if (!existsSync(file)) {
    throw new Error(`Missing ${path.relative(dirname, file)}`);
  }
};

const assertIncludes = (content, text, message) => {
  if (!content.includes(text)) {
    throw new Error(message);
  }
};

const assertNotIncludes = (content, text, message) => {
  if (content.includes(text)) {
    throw new Error(message);
  }
};

for (const [caseId, remoteName, providerPort, consumerPort] of cases) {
  const caseDir = path.join(dirname, 'cases', caseId);

  for (const side of ['provider', 'consumer']) {
    const appDir = path.join(caseDir, side);
    for (const file of [
      'package.json',
      'modern.config.ts',
      'tsconfig.json',
      'src/App.tsx',
      'src/modern-app-env.d.ts',
    ]) {
      assertFile(path.join(appDir, file));
    }

    const modernConfig = read(path.join(appDir, 'modern.config.ts'));
    const expectedPort = side === 'provider' ? providerPort : consumerPort;
    assertIncludes(
      modernConfig,
      `port: ${expectedPort}`,
      `${caseId}/${side} does not use port ${expectedPort}`,
    );

    if (caseId !== 'async-chunk-runtime' || side !== 'provider') {
      assertFile(path.join(appDir, 'module-federation.config.ts'));
      assertIncludes(
        modernConfig,
        'moduleFederationPlugin()',
        `${caseId}/${side} is missing moduleFederationPlugin`,
      );
    }
  }

  const app = read(path.join(caseDir, 'consumer', 'src', 'App.tsx'));
  assertIncludes(
    app,
    'Reproduced Issue',
    `${caseId}/consumer does not render a visible issue state`,
  );
  for (const futureApi of [
    '../../../../shared/agent-runtime',
    'AgentRuntimePanel',
    'useDemoRuntime',
    '__AGENT_RUNTIME__',
    'getSnapshot',
    'getEvents',
    'getActions',
    'runAction',
    'patchSnapshot',
  ]) {
    assertNotIncludes(
      app,
      futureApi,
      `${caseId}/consumer still contains future runtime API: ${futureApi}`,
    );
  }

  const consumerTsconfig = read(
    path.join(caseDir, 'consumer', 'tsconfig.json'),
  );
  assertNotIncludes(
    consumerTsconfig,
    '../../../shared',
    `${caseId}/consumer still includes shared runtime code`,
  );

  if (caseId !== 'async-chunk-runtime') {
    const providerMf = read(
      path.join(caseDir, 'provider', 'module-federation.config.ts'),
    );
    const expectedExpose = expectedProviderExpose[caseId];
    assertIncludes(
      providerMf,
      `name: '${remoteName}'`,
      `${caseId}/provider remote name mismatch`,
    );
    assertIncludes(
      providerMf,
      expectedExpose,
      `${caseId}/provider does not expose ${expectedExpose}`,
    );
  }

  const consumerMf = read(
    path.join(caseDir, 'consumer', 'module-federation.config.ts'),
  );
  assertIncludes(
    consumerMf,
    `${remoteName}@http://localhost:${providerPort}`,
    `${caseId}/consumer remote URL mismatch`,
  );

  if (caseId === 'async-chunk-runtime') {
    const providerModernConfig = read(
      path.join(caseDir, 'provider', 'modern.config.ts'),
    );
    const consumerPackage = read(
      path.join(caseDir, 'consumer', 'package.json'),
    );
    const providerPackage = read(
      path.join(caseDir, 'provider', 'package.json'),
    );
    assertIncludes(
      providerPackage,
      '"build": "pnpm run build:remote && pnpm run build:garfish"',
      `${caseId}/provider build should produce remote and garfish outputs`,
    );
    for (const marker of [
      "uniqueName('ad_rivendell_dev')",
      "chunkLoadingGlobal('webpackChunk_ad_rivendell_dev')",
      "chunkIds('deterministic')",
      "moduleIds('deterministic')",
      'new rspack.container.ModuleFederationPlugin',
      'ASYNC_CHUNK_RUNTIME_BUILD',
    ]) {
      assertIncludes(
        providerModernConfig,
        marker,
        `${caseId}/provider missing ${marker}`,
      );
    }
    for (const marker of [
      "import Garfish from 'garfish'",
      'Garfish.registerApp',
      'Garfish.loadApp',
      'Load Provider Remote',
      'Load Garfish Sub App',
      'garfish-rivendell-container',
    ]) {
      assertIncludes(app, marker, `${caseId}/consumer missing ${marker}`);
    }
    assertIncludes(
      consumerPackage,
      '"garfish": "1.19.4"',
      `${caseId}/consumer does not install Garfish`,
    );
  }

  if (caseId === 'react-multi-version') {
    const providerPanel = read(
      path.join(caseDir, 'provider', 'src', 'RemotePanel.tsx'),
    );
    assertIncludes(
      providerPanel,
      '@otrade/transaction_adapter',
      `${caseId}/provider does not render the bundled dependency`,
    );
    assertIncludes(
      app,
      'RemoteErrorBoundary',
      `${caseId}/consumer does not catch the render error`,
    );
  }

  if (caseId === 'nested-router-tree') {
    const providerPanel = read(
      path.join(caseDir, 'provider', 'src', 'RemotePanel.tsx'),
    );
    assertIncludes(
      providerPanel,
      '<BrowserRouter>',
      `${caseId}/provider does not create a nested router`,
    );
    assertIncludes(
      app,
      '<BrowserRouter>',
      `${caseId}/consumer does not create the host router`,
    );
  }

  if (caseId === 'garfish-provider') {
    const providerGarfishEntry = read(
      path.join(caseDir, 'provider', 'src', 'garfish', 'CreativeHubEntry.tsx'),
    );
    assertIncludes(
      providerGarfishEntry,
      'export const provider',
      `${caseId}/provider does not expose provider`,
    );
    assertNotIncludes(
      providerGarfishEntry,
      '__GARFISH_EXPORTS__.provider',
      `${caseId}/provider should not register provider to Garfish exports`,
    );
    assertIncludes(
      app,
      'Load Creative Hub',
      `${caseId}/consumer does not expose the Garfish load button`,
    );
  }

  if (caseId === 'redirect-loader') {
    const consumerRootLoader = read(
      path.join(caseDir, 'consumer', 'src', 'routes', 'page.loader.ts'),
    );
    assertIncludes(
      consumerRootLoader,
      "redirect('/home')",
      `${caseId}/consumer does not define the SSR redirect loader`,
    );
    assertIncludes(
      app,
      'Run client fallback',
      `${caseId}/consumer does not expose the fallback button`,
    );
  }

  if (caseId === 'usenavigate-blank') {
    const providerExportApp = read(
      path.join(caseDir, 'provider', 'src', 'export-app.tsx'),
    );
    assertIncludes(
      providerExportApp,
      'createBridgeComponent',
      `${caseId}/provider does not export a bridge app`,
    );
    assertIncludes(
      app,
      'Navigate to lineage',
      `${caseId}/consumer does not expose the navigation button`,
    );
  }
}

const sharedRuntimePath = path.join(dirname, 'shared', 'agent-runtime.tsx');
if (existsSync(sharedRuntimePath)) {
  throw new Error('shared/agent-runtime.tsx should not be part of demos');
}

const readme = read(path.join(dirname, 'README.md'));
for (const futureApi of ['__AGENT_RUNTIME__', 'runAction', 'getSnapshot']) {
  assertNotIncludes(
    readme,
    futureApi,
    `README still mentions future runtime API: ${futureApi}`,
  );
}

console.log(`Verified ${cases.length} Modern.js MF demo cases.`);
