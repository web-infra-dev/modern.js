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

const requiredProjectFiles = [
  'package.json',
  'modern.config.ts',
  'module-federation.config.ts',
  'tsconfig.json',
  'src/App.tsx',
  'src/modern-app-env.d.ts',
];

for (const [caseId, remoteName, providerPort, consumerPort] of cases) {
  const caseDir = path.join(dirname, 'cases', caseId);
  for (const side of ['provider', 'consumer']) {
    const appDir = path.join(caseDir, side);
    for (const file of requiredProjectFiles) {
      const target = path.join(appDir, file);
      if (!existsSync(target)) {
        throw new Error(`Missing ${caseId}/${side}/${file}`);
      }
    }
    const modernConfig = readFileSync(
      path.join(appDir, 'modern.config.ts'),
      'utf8',
    );
    const expectedPort = side === 'provider' ? providerPort : consumerPort;
    if (!modernConfig.includes(`port: ${expectedPort}`)) {
      throw new Error(`${caseId}/${side} does not use port ${expectedPort}`);
    }
    if (!modernConfig.includes('moduleFederationPlugin()')) {
      throw new Error(`${caseId}/${side} is missing moduleFederationPlugin`);
    }
  }

  const providerMf = readFileSync(
    path.join(caseDir, 'provider', 'module-federation.config.ts'),
    'utf8',
  );
  if (!providerMf.includes(`name: '${remoteName}'`)) {
    throw new Error(`${caseId}/provider remote name mismatch`);
  }
  if (!providerMf.includes("'./RemotePanel'")) {
    throw new Error(`${caseId}/provider does not expose RemotePanel`);
  }

  const consumerMf = readFileSync(
    path.join(caseDir, 'consumer', 'module-federation.config.ts'),
    'utf8',
  );
  if (!consumerMf.includes(`${remoteName}@http://localhost:${providerPort}`)) {
    throw new Error(`${caseId}/consumer remote URL mismatch`);
  }

  const app = readFileSync(
    path.join(caseDir, 'consumer', 'src', 'App.tsx'),
    'utf8',
  );
  if (
    !app.includes('../../../../shared/agent-runtime') ||
    !app.includes('useDemoRuntime') ||
    !app.includes('AgentRuntimePanel')
  ) {
    throw new Error(`${caseId}/consumer does not install the demo runtime`);
  }

  const consumerTsconfig = readFileSync(
    path.join(caseDir, 'consumer', 'tsconfig.json'),
    'utf8',
  );
  if (!consumerTsconfig.includes('"../../../shared"')) {
    throw new Error(`${caseId}/consumer tsconfig does not include shared code`);
  }
}

const sharedRuntime = readFileSync(
  path.join(dirname, 'shared', 'agent-runtime.tsx'),
  'utf8',
);
for (const api of [
  'getSnapshot',
  'getEvents',
  'waitForEvent',
  'getActions',
  'runAction',
]) {
  if (!sharedRuntime.includes(api)) {
    throw new Error(`Shared runtime missing ${api}`);
  }
}

console.log(`Verified ${cases.length} Modern.js MF demo cases.`);
