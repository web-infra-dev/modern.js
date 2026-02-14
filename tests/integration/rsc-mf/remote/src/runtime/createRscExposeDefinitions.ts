import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const CALLBACK_BOOTSTRAP_IMPORT = './src/runtime/initServerCallback.ts';
const CALLBACK_BOOTSTRAP_PREFIX = './src/runtime/';
const USERLAND_EXPOSE_PREFIX = './';
const SOURCE_ENTRY_EXTENSION_PATTERN = /\.[cm]?[jt]sx?$/i;
const RSC_LAYER = 'react-server-components';
const LOCAL_MODULE_SPECIFIER_PATTERN = /^\.{1,2}\//;
const SOURCE_DIRECTIVE_PATTERN = /^\s*['"]use (?:client|server)['"]\s*;?/m;
const SOURCE_ENTRY_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
] as const;
const REMOTE_PROJECT_ROOT = path.resolve(__dirname, '../..');
const callbackDirectiveBySourceFile = new Map<string, boolean>();

type ExposeImportInput = string | string[];
export type ExposeDefinitionInput =
  | string
  | ({
      import: ExposeImportInput;
    } & Record<string, unknown>);
type NormalizedExposeImportPaths = Record<string, string[]>;
interface NormalizedExposeDefinition {
  importPaths: string[];
  exposeOverrides: Record<string, unknown>;
}
const normalizeImportPaths = (exposeKey: string, importPaths: string[]) => {
  const normalizedImportPaths = importPaths.map(importPath =>
    importPath.trim(),
  );
  const hasEmptyImportPath = normalizedImportPaths.some(
    importPath => importPath.length === 0,
  );
  if (hasEmptyImportPath) {
    throw new Error(
      `Remote expose import paths must be non-empty tokens after trimming. Invalid entry: ${exposeKey}`,
    );
  }
  return [...new Set(normalizedImportPaths)];
};

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
      importPaths: normalizeImportPaths(exposeKey, [exposeDefinition]),
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
      importPaths: normalizeImportPaths(exposeKey, [exposeImport]),
      exposeOverrides,
    } satisfies NormalizedExposeDefinition;
  }
  if (
    Array.isArray(exposeImport) &&
    exposeImport.length > 0 &&
    exposeImport.every(item => typeof item === 'string')
  ) {
    const normalizedImportPaths = normalizeImportPaths(exposeKey, exposeImport);
    if (normalizedImportPaths.includes(CALLBACK_BOOTSTRAP_IMPORT)) {
      throw new Error(
        `Callback bootstrap module (${CALLBACK_BOOTSTRAP_IMPORT}) must remain internal-only and cannot be exposed. Invalid entries: ${exposeKey}`,
      );
    }
    if (normalizedImportPaths.length > 1) {
      throw new Error(
        `Remote expose import arrays must normalize to a single userland module path. Invalid entry: ${exposeKey}`,
      );
    }
    return {
      importPaths: normalizedImportPaths,
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
  includeCallbackBootstrap: boolean,
) =>
  ({
    ...exposeOverrides,
    import: includeCallbackBootstrap
      ? [CALLBACK_BOOTSTRAP_IMPORT, ...importPaths]
      : importPaths,
    layer: RSC_LAYER,
  }) as const;

const shouldInjectCallbackBootstrap = (importPaths: string[]) =>
  importPaths.some(importPath =>
    referencesCallbackCapableSourceModule(importPath),
  );

interface SourceModuleSpecifier {
  moduleSpecifier: string;
  typeOnly: boolean;
}

const getScriptKindByFilePath = (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.js':
    case '.mjs':
    case '.cjs':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
};

const getImportDeclarationTypeOnlyState = (node: ts.ImportDeclaration) => {
  const importClause = node.importClause;
  if (!importClause) {
    return false;
  }
  if (importClause.isTypeOnly) {
    return true;
  }
  if (importClause.name) {
    return false;
  }
  const namedBindings = importClause.namedBindings;
  if (!namedBindings) {
    return false;
  }
  if (ts.isNamespaceImport(namedBindings)) {
    return false;
  }
  if (ts.isNamedImports(namedBindings)) {
    if (namedBindings.elements.length === 0) {
      return false;
    }
    return namedBindings.elements.every(element => element.isTypeOnly);
  }
  return false;
};

const getExportDeclarationTypeOnlyState = (node: ts.ExportDeclaration) => {
  if (node.isTypeOnly) {
    return true;
  }
  if (!node.exportClause) {
    return false;
  }
  if (ts.isNamespaceExport(node.exportClause)) {
    return false;
  }
  if (ts.isNamedExports(node.exportClause)) {
    if (node.exportClause.elements.length === 0) {
      return false;
    }
    return node.exportClause.elements.every(element => element.isTypeOnly);
  }
  return false;
};

const collectLocalModuleSpecifiers = (
  filePath: string,
  sourceText: string,
): SourceModuleSpecifier[] => {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKindByFilePath(filePath),
  );
  const moduleSpecifiers: SourceModuleSpecifier[] = [];

  const collectNodeSpecifiers = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      if (ts.isStringLiteralLike(node.moduleSpecifier)) {
        moduleSpecifiers.push({
          moduleSpecifier: node.moduleSpecifier.text,
          typeOnly: getImportDeclarationTypeOnlyState(node),
        });
      }
      return;
    }

    if (ts.isExportDeclaration(node)) {
      if (
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        moduleSpecifiers.push({
          moduleSpecifier: node.moduleSpecifier.text,
          typeOnly: getExportDeclarationTypeOnlyState(node),
        });
      }
      return;
    }

    if (ts.isCallExpression(node)) {
      const [firstArgument] = node.arguments;
      if (!firstArgument || !ts.isStringLiteralLike(firstArgument)) {
        return;
      }
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        moduleSpecifiers.push({
          moduleSpecifier: firstArgument.text,
          typeOnly: false,
        });
        return;
      }
      if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require'
      ) {
        moduleSpecifiers.push({
          moduleSpecifier: firstArgument.text,
          typeOnly: false,
        });
      }
    }
  };

  const walkNode = (node: ts.Node): void => {
    collectNodeSpecifiers(node);
    ts.forEachChild(node, walkNode);
  };
  walkNode(sourceFile);

  return moduleSpecifiers;
};

const readSourceFile = (filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
};

const resolveUserlandImportPathToFile = (
  importPath: string,
  fromFilePath?: string,
) => {
  const importPathWithoutPrefix = importPath.replace(/^\.\//, '');
  const basePath = fromFilePath
    ? path.resolve(path.dirname(fromFilePath), importPath)
    : path.resolve(REMOTE_PROJECT_ROOT, importPathWithoutPrefix);
  const hasExplicitExtension = SOURCE_ENTRY_EXTENSIONS.some(extension =>
    basePath.endsWith(extension),
  );
  if (hasExplicitExtension) {
    return fs.existsSync(basePath) ? basePath : undefined;
  }
  const extensionCandidates = SOURCE_ENTRY_EXTENSIONS.map(
    extension => `${basePath}${extension}`,
  );
  const indexCandidates = SOURCE_ENTRY_EXTENSIONS.map(extension =>
    path.join(basePath, `index${extension}`),
  );
  return [...extensionCandidates, ...indexCandidates].find(candidatePath =>
    fs.existsSync(candidatePath),
  );
};

const referencesCallbackCapableSourceModule = (importPath: string) => {
  const rootSourceFile = resolveUserlandImportPathToFile(importPath);
  if (!rootSourceFile) {
    return false;
  }

  const visitedFiles = new Set<string>();
  const hasCallbackDirective = (filePath: string): boolean => {
    const cachedResult = callbackDirectiveBySourceFile.get(filePath);
    if (typeof cachedResult !== 'undefined') {
      return cachedResult;
    }
    if (visitedFiles.has(filePath)) {
      return false;
    }
    visitedFiles.add(filePath);
    const sourceText = readSourceFile(filePath);
    if (!sourceText) {
      callbackDirectiveBySourceFile.set(filePath, false);
      return false;
    }
    if (SOURCE_DIRECTIVE_PATTERN.test(sourceText)) {
      callbackDirectiveBySourceFile.set(filePath, true);
      return true;
    }

    const localSpecifierMatches = collectLocalModuleSpecifiers(
      filePath,
      sourceText,
    );

    for (const { moduleSpecifier, typeOnly } of localSpecifierMatches) {
      if (
        typeOnly ||
        typeof moduleSpecifier !== 'string' ||
        !LOCAL_MODULE_SPECIFIER_PATTERN.test(moduleSpecifier)
      ) {
        continue;
      }
      const childModuleFilePath = resolveUserlandImportPathToFile(
        moduleSpecifier,
        filePath,
      );
      if (!childModuleFilePath) {
        continue;
      }
      if (hasCallbackDirective(childModuleFilePath)) {
        callbackDirectiveBySourceFile.set(filePath, true);
        return true;
      }
    }

    callbackDirectiveBySourceFile.set(filePath, false);
    return false;
  };

  return hasCallbackDirective(rootSourceFile);
};

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
        shouldInjectCallbackBootstrap(normalizedDefinition.importPaths),
      ),
    ]),
  );
};

export const CALLBACK_BOOTSTRAP_MODULE = CALLBACK_BOOTSTRAP_IMPORT;
