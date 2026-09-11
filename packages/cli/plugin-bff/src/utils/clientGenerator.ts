import path from 'path';
import { type GenClientOptions, generateClient } from '@modern-js/bff-core';
import type { HttpMethodDecider } from '@modern-js/types';
import { fs, logger } from '@modern-js/utils';

export type APILoaderOptions = {
  prefix: string;
  appDir: string;
  apiDir: string;
  lambdaDir: string;
  existLambda: boolean;
  port?: number;
  requestCreator?: string;
  httpMethodDecider?: HttpMethodDecider;
  relativeDistPath: string;
  relativeApiPath: string;
  /**
   * `'module'` for native ESM output (`package.json#type: "module"`); the
   * generated facade then re-exports with an explicit `.js` extension so
   * `node16`/`nodenext` consumers resolve it.
   */
  moduleType?: 'module' | 'commonjs';
  /**
   * Absolute paths of the valid API files, resolved by ApiRouter with the same
   * `API_FILE_RULES` the runtime router uses. Passing them in keeps the client
   * generator and the router in agreement about what an API module is, so stray
   * artifacts next to the sources (compiled `.d.ts`/`.js`, tests, private files)
   * never reach `generateClient`.
   */
  apiFiles: string[];
};

interface FileDetails {
  resourcePath: string;
  source: string;
  targetDir: string;
  name: string;
  absTargetDir: string;
  relativeTargetDistDir: string;
  exportKey: string;
}
const API_DIR = 'api';
const PLUGIN_DIR = 'plugin';
const RUNTIME_DIR = 'runtime';
const CLIENT_DIR = 'client';

const EXPORT_PREFIX = `./${API_DIR}/`;
const TYPE_PREFIX = `${API_DIR}/`;

const toPosixPath = (p: string) => p.replace(/\\/g, '/');
const posixJoin = (...args: string[]) => toPosixPath(path.join(...args));

// `generateClient` emits `export default createRequest(...)` only when the
// handler declares a default export, so the generated client `.js` is an exact
// signal for whether the facade needs a `default` re-export.
const DEFAULT_EXPORT_RE = /(^|[\s;])export\s+default\b/;

// The published client re-exports the handler's own declaration instead of
// copying it. A verbatim copy landed the `.d.ts` one directory shallower than
// tsc emitted it (`dist/client/*` vs `dist/<lambda>/*`), breaking every
// relative specifier inside. A facade leaves the original declarations in place
// (relative refs intact, and published via `**/*.d.ts`) and only points at them.
export function buildClientTypeFacade(
  clientTypesFile: string,
  originTypesFile: string,
  hasDefaultExport: boolean,
  esm = false,
): string {
  const originNoExt = originTypesFile.replace(/\.d\.ts$/, '');
  let specifier = toPosixPath(
    path.relative(path.dirname(clientTypesFile), originNoExt),
  );
  if (!specifier.startsWith('.')) {
    specifier = `./${specifier}`;
  }
  // Native ESM (`node16`/`nodenext`) requires an explicit extension in the
  // re-export specifier, matching the `.js` the declaration emit produces; TS
  // resolves `./x.js` back to `./x.d.ts`.
  if (esm) {
    specifier = `${specifier}.js`;
  }

  const lines: string[] = [];
  // `export *` never carries the default binding, so re-export it explicitly.
  if (hasDefaultExport) {
    lines.push(`export { default } from '${specifier}';`);
  }
  lines.push(`export * from '${specifier}';`);
  return `${lines.join('\n')}\n`;
}

export async function readDirectoryFiles(
  appDirectory: string,
  directory: string,
  relativeDistPath: string,
  apiFiles: string[],
): Promise<FileDetails[]> {
  const filesList: FileDetails[] = [];

  for (const resourcePath of apiFiles) {
    const source = await fs.readFile(resourcePath, 'utf8');
    const currentPath = path.dirname(resourcePath);
    const relativePath = path.relative(directory, resourcePath);
    const parsedPath = path.parse(relativePath);

    const targetDir = posixJoin(
      `./${relativeDistPath}/${CLIENT_DIR}`,
      parsedPath.dir,
      `${parsedPath.name}.js`,
    );
    const name = parsedPath.name;
    const absTargetDir = path.resolve(targetDir);
    const relativePathFromAppDirectory = path.relative(
      appDirectory,
      currentPath,
    );
    const typesFilePath = posixJoin(
      `./${relativeDistPath}`,
      relativePathFromAppDirectory,
      `${name}.d.ts`,
    );
    const relativeTargetDistDir = `./${typesFilePath}`;
    const exportKey = toPosixPath(path.join(parsedPath.dir, name));

    filesList.push({
      resourcePath,
      source,
      targetDir,
      name,
      absTargetDir,
      relativeTargetDistDir,
      exportKey,
    });
  }

  return filesList;
}

function mergePackageJson(
  packageJson: any,
  files: string[],
  typesVersion: Record<string, any>,
  exports: Record<string, any>,
) {
  packageJson.files = [...new Set([...(packageJson.files || []), ...files])];

  packageJson.typesVersions ??= {};
  const starTypes = packageJson.typesVersions['*'] || {};
  Object.keys(starTypes).forEach(
    k => k.startsWith(TYPE_PREFIX) && delete starTypes[k],
  );
  packageJson.typesVersions['*'] = {
    ...starTypes,
    ...(typesVersion['*'] || {}),
  };

  packageJson.exports ??= {};
  Object.keys(packageJson.exports).forEach(
    k => k.startsWith(EXPORT_PREFIX) && delete packageJson.exports[k],
  );
  Object.assign(packageJson.exports, exports);
}

async function writeTargetFile(absTargetDir: string, content: string) {
  await fs.mkdir(path.dirname(absTargetDir), { recursive: true });
  await fs.writeFile(absTargetDir, content);
}

async function setPackage(
  files: {
    exportKey: string;
    targetDir: string;
    relativeTargetDistDir: string;
  }[],
  appDirectory: string,
  relativeDistPath: string,
) {
  try {
    const packagePath = path.resolve(appDirectory, './package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    const addFiles = [
      posixJoin(relativeDistPath, CLIENT_DIR, '**', '*'),
      posixJoin(relativeDistPath, RUNTIME_DIR, '**', '*'),
      posixJoin(relativeDistPath, PLUGIN_DIR, '**', '*'),
      // The client facade re-exports declarations that stay in their original
      // `dist/<lambda>` / `dist/shared` locations, so every emitted `.d.ts`
      // must ship or consumers resolve the facade to a missing file (TS2307).
      posixJoin(relativeDistPath, '**', '*.d.ts'),
    ];

    const typesVersions = {
      '*': files.reduce(
        (acc, file) => {
          const typeFilePath = toPosixPath(`./${file.targetDir}`).replace(
            'js',
            'd.ts',
          );
          return {
            ...acc,
            [toPosixPath(`${TYPE_PREFIX}${file.exportKey}`)]: [typeFilePath],
          };
        },
        {
          [`${API_DIR}/*`]: [
            toPosixPath(`./${relativeDistPath}/${CLIENT_DIR}/*.d.ts`),
          ],
          [RUNTIME_DIR]: [
            toPosixPath(`./${relativeDistPath}/${RUNTIME_DIR}/index.d.ts`),
          ],
          [PLUGIN_DIR]: [
            toPosixPath(`./${relativeDistPath}/${PLUGIN_DIR}/index.d.ts`),
          ],
        },
      ),
    };

    const exports = files.reduce(
      (acc, file) => {
        const exportKey = `${EXPORT_PREFIX}${file.exportKey}`;
        const jsFilePath = toPosixPath(`./${file.targetDir}`);

        return {
          ...acc,
          [toPosixPath(exportKey)]: {
            import: jsFilePath,
            types: toPosixPath(jsFilePath.replace(/\.js$/, '.d.ts')),
          },
        };
      },
      {
        [toPosixPath(`./${API_DIR}/*`)]: {
          import: toPosixPath(`./${relativeDistPath}/${CLIENT_DIR}/*.js`),
          types: toPosixPath(`./${relativeDistPath}/${CLIENT_DIR}/*.d.ts`),
        },
        [toPosixPath(`./${PLUGIN_DIR}`)]: {
          import: toPosixPath(`./${relativeDistPath}/${PLUGIN_DIR}/index.js`),
          require: toPosixPath(`./${relativeDistPath}/${PLUGIN_DIR}/index.js`),
          types: toPosixPath(`./${relativeDistPath}/${PLUGIN_DIR}/index.d.ts`),
        },
        [toPosixPath(`./${RUNTIME_DIR}`)]: {
          import: toPosixPath(`./${relativeDistPath}/${RUNTIME_DIR}/index.js`),
          require: toPosixPath(`./${relativeDistPath}/${RUNTIME_DIR}/index.js`),
          types: toPosixPath(`./${relativeDistPath}/${RUNTIME_DIR}/index.d.ts`),
        },
      },
    );

    mergePackageJson(packageJson, addFiles, typesVersions, exports);

    const handle = await fs.promises.open(packagePath, 'w');
    try {
      await handle.write(JSON.stringify(packageJson, null, 2));
      await handle.write('\n');
    } finally {
      await handle.close();
    }
  } catch (error) {
    logger.error(`package.json update failed: ${error}`);
  }
}

async function clientGenerator(draftOptions: APILoaderOptions) {
  const sourceList = await readDirectoryFiles(
    draftOptions.appDir,
    draftOptions.lambdaDir,
    draftOptions.relativeDistPath,
    draftOptions.apiFiles,
  );

  const getClitentCode = async (resourcePath: string, source: string) => {
    const warning = `The file ${resourcePath} is not allowed to be imported in src directory, only API definition files are allowed.`;

    if (!draftOptions.existLambda) {
      logger.warn(warning);
      return;
    }

    const options: GenClientOptions = {
      prefix: (Array.isArray(draftOptions.prefix)
        ? draftOptions.prefix[0]
        : draftOptions.prefix) as string,
      appDir: draftOptions.appDir,
      apiDir: draftOptions.apiDir,
      lambdaDir: draftOptions.lambdaDir,
      port: Number(draftOptions.port),
      source,
      resourcePath,
      target: 'bundle',
      httpMethodDecider: draftOptions.httpMethodDecider,
      requestCreator: draftOptions.requestCreator,
    };

    const { lambdaDir } = draftOptions as any;
    if (!resourcePath.startsWith(lambdaDir)) {
      logger.warn(warning);
      return;
    }

    const result = await generateClient(options);

    return result;
  };

  try {
    for (const source of sourceList) {
      const code = await getClitentCode(source.resourcePath, source.source);
      if (code?.value) {
        await writeTargetFile(source.absTargetDir, code.value);
        const clientTypesFile = source.targetDir.replace(/\.js$/, '.d.ts');
        await writeTargetFile(
          path.resolve(clientTypesFile),
          buildClientTypeFacade(
            clientTypesFile,
            source.relativeTargetDistDir,
            DEFAULT_EXPORT_RE.test(code.value),
            draftOptions.moduleType === 'module',
          ),
        );
      }
    }
    logger.info(`Client bundle generate succeed`);
  } catch (error) {
    logger.error(`Client bundle generate failed: ${error}`);
  }

  await setPackage(
    sourceList,
    draftOptions.appDir,
    draftOptions.relativeDistPath,
  );
}

export default clientGenerator;
