const CALLBACK_BOOTSTRAP_IMPORT = './src/runtime/initServerCallback.ts';
const CALLBACK_BOOTSTRAP_PREFIX = './src/runtime/';
const USERLAND_EXPOSE_PREFIX = './src/';

if (!CALLBACK_BOOTSTRAP_IMPORT.startsWith(CALLBACK_BOOTSTRAP_PREFIX)) {
  throw new Error(
    `Callback bootstrap import must stay in runtime namespace (${CALLBACK_BOOTSTRAP_PREFIX}). Received: ${CALLBACK_BOOTSTRAP_IMPORT}`,
  );
}
if (!/\.[tj]sx?$/.test(CALLBACK_BOOTSTRAP_IMPORT)) {
  throw new Error(
    `Callback bootstrap import must use explicit source extension for deterministic resolution. Received: ${CALLBACK_BOOTSTRAP_IMPORT}`,
  );
}
if (
  CALLBACK_BOOTSTRAP_IMPORT.includes('..') ||
  CALLBACK_BOOTSTRAP_IMPORT.includes('\\')
) {
  throw new Error(
    `Callback bootstrap import must not contain traversal or Windows separators. Received: ${CALLBACK_BOOTSTRAP_IMPORT}`,
  );
}

const createRscExpose = (importPath: string) =>
  ({
    import: [CALLBACK_BOOTSTRAP_IMPORT, importPath],
    layer: 'react-server-components',
  }) as const;

const assertValidExposeConfig = (
  remoteExposeImports: Record<string, string>,
) => {
  const invalidExposeKeys = Object.keys(remoteExposeImports).filter(
    exposeKey => !exposeKey.startsWith('./'),
  );
  if (invalidExposeKeys.length > 0) {
    throw new Error(
      `Remote expose keys must be module-federation paths starting with "./". Invalid keys: ${invalidExposeKeys.join(', ')}`,
    );
  }

  const callbackExposeEntries = Object.entries(remoteExposeImports).filter(
    ([, importPath]) => importPath === CALLBACK_BOOTSTRAP_IMPORT,
  );
  if (callbackExposeEntries.length > 0) {
    throw new Error(
      `Callback bootstrap module (${CALLBACK_BOOTSTRAP_IMPORT}) must remain internal-only and cannot be exposed. Invalid entries: ${callbackExposeEntries
        .map(([exposeKey]) => exposeKey)
        .join(', ')}`,
    );
  }

  const nonPosixExposeEntries = Object.entries(remoteExposeImports).filter(
    ([, importPath]) => importPath.includes('\\'),
  );
  if (nonPosixExposeEntries.length > 0) {
    throw new Error(
      `Remote expose imports must use POSIX separators for deterministic module ids. Invalid entries: ${nonPosixExposeEntries
        .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
        .join(', ')}`,
    );
  }

  const nonUserlandExposeEntries = Object.entries(remoteExposeImports).filter(
    ([, importPath]) => !importPath.startsWith(USERLAND_EXPOSE_PREFIX),
  );
  if (nonUserlandExposeEntries.length > 0) {
    throw new Error(
      `Remote exposes must point to userland source modules (${USERLAND_EXPOSE_PREFIX}). Invalid entries: ${nonUserlandExposeEntries
        .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
        .join(', ')}`,
    );
  }
  const runtimeNamespaceExposeEntries = Object.entries(
    remoteExposeImports,
  ).filter(([, importPath]) =>
    importPath.startsWith(CALLBACK_BOOTSTRAP_PREFIX),
  );
  if (runtimeNamespaceExposeEntries.length > 0) {
    throw new Error(
      `Remote exposes must not target internal runtime namespace (${CALLBACK_BOOTSTRAP_PREFIX}). Invalid entries: ${runtimeNamespaceExposeEntries
        .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
        .join(', ')}`,
    );
  }

  const nonTypeScriptExposeEntries = Object.entries(remoteExposeImports).filter(
    ([, importPath]) => !/\.[tj]sx?$/.test(importPath),
  );
  if (nonTypeScriptExposeEntries.length > 0) {
    throw new Error(
      `Remote expose imports must use explicit TypeScript entry extensions for deterministic resolution. Invalid entries: ${nonTypeScriptExposeEntries
        .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
        .join(', ')}`,
    );
  }

  const parentTraversalExposeEntries = Object.entries(
    remoteExposeImports,
  ).filter(([, importPath]) => importPath.includes('..'));
  if (parentTraversalExposeEntries.length > 0) {
    throw new Error(
      `Remote expose imports must not contain parent directory traversal segments. Invalid entries: ${parentTraversalExposeEntries
        .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
        .join(', ')}`,
    );
  }
};

export const createRscExposeDefinitions = (
  remoteExposeImports: Record<string, string>,
) => {
  assertValidExposeConfig(remoteExposeImports);

  return Object.fromEntries(
    Object.entries(remoteExposeImports).map(([exposeKey, importPath]) => [
      exposeKey,
      createRscExpose(importPath),
    ]),
  );
};

export const CALLBACK_BOOTSTRAP_MODULE = CALLBACK_BOOTSTRAP_IMPORT;
