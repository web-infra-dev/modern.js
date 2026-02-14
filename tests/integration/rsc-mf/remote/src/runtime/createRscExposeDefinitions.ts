const CALLBACK_BOOTSTRAP_IMPORT = './src/runtime/initServerCallback.ts';
const CALLBACK_BOOTSTRAP_PREFIX = './src/runtime/';
const USERLAND_EXPOSE_PREFIX = './';
const SOURCE_ENTRY_EXTENSION_PATTERN = /\.[cm]?[jt]sx?$/i;
const RSC_LAYER = 'react-server-components';

type ExposeImportInput = string | string[];
type ExposeDefinitionInput =
  | string
  | ({
      import: ExposeImportInput;
    } & Record<string, unknown>);
type NormalizedExposeImportPaths = Record<string, string[]>;
interface NormalizedExposeDefinition {
  importPaths: string[];
  exposeOverrides: Record<string, unknown>;
}

if (!CALLBACK_BOOTSTRAP_IMPORT.startsWith(CALLBACK_BOOTSTRAP_PREFIX)) {
  throw new Error(
    `Callback bootstrap import must stay in runtime namespace (${CALLBACK_BOOTSTRAP_PREFIX}). Received: ${CALLBACK_BOOTSTRAP_IMPORT}`,
  );
}
if (!SOURCE_ENTRY_EXTENSION_PATTERN.test(CALLBACK_BOOTSTRAP_IMPORT)) {
  throw new Error(
    `Callback bootstrap import must use an explicit source entry extension for deterministic resolution. Received: ${CALLBACK_BOOTSTRAP_IMPORT}`,
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

const normalizeExposeImportPaths = (
  exposeKey: string,
  exposeDefinition: ExposeDefinitionInput,
) => {
  if (typeof exposeDefinition === 'string') {
    return {
      importPaths: [exposeDefinition],
      exposeOverrides: {},
    } satisfies NormalizedExposeDefinition;
  }

  if (!exposeDefinition || typeof exposeDefinition !== 'object') {
    throw new Error(
      `Remote expose definition must be a string path or an object with an import field. Invalid entry: ${exposeKey} -> ${String(exposeDefinition)}`,
    );
  }

  const { import: exposeImport, ...exposeOverrides } = exposeDefinition;
  if (typeof exposeImport === 'string') {
    return {
      importPaths: [exposeImport],
      exposeOverrides,
    } satisfies NormalizedExposeDefinition;
  }
  if (
    Array.isArray(exposeImport) &&
    exposeImport.length > 0 &&
    exposeImport.every(item => typeof item === 'string')
  ) {
    return {
      importPaths: exposeImport,
      exposeOverrides,
    } satisfies NormalizedExposeDefinition;
  }
  throw new Error(
    `Remote expose import must be a non-empty string or string array. Invalid entry: ${exposeKey}`,
  );
};

const createRscExpose = (
  importPaths: string[],
  exposeOverrides: Record<string, unknown>,
) =>
  ({
    ...exposeOverrides,
    import: [CALLBACK_BOOTSTRAP_IMPORT, ...importPaths],
    layer: RSC_LAYER,
  }) as const;

const assertValidExposeConfig = (
  normalizedExposeImportPaths: NormalizedExposeImportPaths,
) => {
  const invalidExposeKeys = Object.keys(normalizedExposeImportPaths).filter(
    exposeKey => !exposeKey.startsWith('./'),
  );
  if (invalidExposeKeys.length > 0) {
    throw new Error(
      `Remote expose keys must be module-federation paths starting with "./". Invalid keys: ${invalidExposeKeys.join(', ')}`,
    );
  }

  const callbackExposeEntries = Object.entries(
    normalizedExposeImportPaths,
  ).filter(([, importPaths]) =>
    importPaths.includes(CALLBACK_BOOTSTRAP_IMPORT),
  );
  if (callbackExposeEntries.length > 0) {
    throw new Error(
      `Callback bootstrap module (${CALLBACK_BOOTSTRAP_IMPORT}) must remain internal-only and cannot be exposed. Invalid entries: ${callbackExposeEntries
        .map(([exposeKey]) => exposeKey)
        .join(', ')}`,
    );
  }

  const nonPosixExposeEntries = Object.entries(
    normalizedExposeImportPaths,
  ).flatMap(([exposeKey, importPaths]) =>
    importPaths
      .filter(importPath => importPath.includes('\\'))
      .map(importPath => `${exposeKey} -> ${importPath}`),
  );
  if (nonPosixExposeEntries.length > 0) {
    throw new Error(
      `Remote expose imports must use POSIX separators for deterministic module ids. Invalid entries: ${nonPosixExposeEntries.join(
        ', ',
      )}`,
    );
  }

  const nonUserlandExposeEntries = Object.entries(
    normalizedExposeImportPaths,
  ).flatMap(([exposeKey, importPaths]) =>
    importPaths
      .filter(importPath => !importPath.startsWith(USERLAND_EXPOSE_PREFIX))
      .map(importPath => `${exposeKey} -> ${importPath}`),
  );
  if (nonUserlandExposeEntries.length > 0) {
    throw new Error(
      `Remote exposes must point to userland relative modules (${USERLAND_EXPOSE_PREFIX}). Invalid entries: ${nonUserlandExposeEntries.join(
        ', ',
      )}`,
    );
  }
  const runtimeNamespaceExposeEntries = Object.entries(
    normalizedExposeImportPaths,
  ).flatMap(([exposeKey, importPaths]) =>
    importPaths
      .filter(importPath => importPath.startsWith(CALLBACK_BOOTSTRAP_PREFIX))
      .map(importPath => `${exposeKey} -> ${importPath}`),
  );
  if (runtimeNamespaceExposeEntries.length > 0) {
    throw new Error(
      `Remote exposes must not target internal runtime namespace (${CALLBACK_BOOTSTRAP_PREFIX}). Invalid entries: ${runtimeNamespaceExposeEntries.join(
        ', ',
      )}`,
    );
  }

  const nonSourceEntryExposeEntries = Object.entries(
    normalizedExposeImportPaths,
  ).flatMap(([exposeKey, importPaths]) =>
    importPaths
      .filter(importPath => !SOURCE_ENTRY_EXTENSION_PATTERN.test(importPath))
      .map(importPath => `${exposeKey} -> ${importPath}`),
  );
  if (nonSourceEntryExposeEntries.length > 0) {
    throw new Error(
      `Remote expose imports must use explicit source entry extensions (.js/.jsx/.ts/.tsx/.cjs/.mjs/.cts/.mts) for deterministic resolution. Invalid entries: ${nonSourceEntryExposeEntries.join(
        ', ',
      )}`,
    );
  }

  const parentTraversalExposeEntries = Object.entries(
    normalizedExposeImportPaths,
  ).flatMap(([exposeKey, importPaths]) =>
    importPaths
      .filter(importPath => importPath.includes('..'))
      .map(importPath => `${exposeKey} -> ${importPath}`),
  );
  if (parentTraversalExposeEntries.length > 0) {
    throw new Error(
      `Remote expose imports must not contain parent directory traversal segments. Invalid entries: ${parentTraversalExposeEntries.join(
        ', ',
      )}`,
    );
  }
};

export const createRscExposeDefinitions = (
  remoteExposeImports: Record<string, ExposeDefinitionInput>,
) => {
  const normalizedExposeEntries: Array<[string, NormalizedExposeDefinition]> =
    Object.entries(remoteExposeImports).map(([exposeKey, exposeDefinition]) => [
      exposeKey,
      normalizeExposeImportPaths(exposeKey, exposeDefinition),
    ]);
  const normalizedExposeImportPaths = Object.fromEntries(
    normalizedExposeEntries.map(([exposeKey, normalizedDefinition]) => [
      exposeKey,
      normalizedDefinition.importPaths,
    ]),
  );
  assertValidExposeConfig(normalizedExposeImportPaths);

  return Object.fromEntries(
    normalizedExposeEntries.map(([exposeKey, normalizedDefinition]) => [
      exposeKey,
      createRscExpose(
        normalizedDefinition.importPaths,
        normalizedDefinition.exposeOverrides,
      ),
    ]),
  );
};

export const CALLBACK_BOOTSTRAP_MODULE = CALLBACK_BOOTSTRAP_IMPORT;
