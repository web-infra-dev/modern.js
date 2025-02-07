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

function deepMerge<T extends Record<string, any>>(
  target: T | undefined,
  source: Partial<T>,
  strategy?: {
    array?: 'append' | 'prepend' | 'replace';
    dedupe?: boolean;
  },
): T {
  const base = (target || {}) as T;
  const merged = { ...base };

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value) && Array.isArray(base[key])) {
      merged[key as keyof T] = [
        ...(strategy?.array === 'prepend' ? value : base[key]),
        ...(strategy?.array === 'append' ? value : []),
        ...(strategy?.array !== 'replace' && strategy?.array !== 'prepend'
          ? base[key]
          : []),
      ].filter((v, i, a) =>
        strategy?.dedupe
          ? a.findIndex(e => JSON.stringify(e) === JSON.stringify(v)) === i
          : true,
      ) as T[keyof T];
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      merged[key as keyof T] = deepMerge(base[key], value, strategy);
      continue;
    }

    if (!(key in base)) {
      merged[key as keyof T] = value;
    }
  }

  return merged;
}

const filterObjectKeys = <T extends Record<string, any>>(
  obj: T | undefined,
  predicate: (key: string) => boolean,
): T => {
  return Object.fromEntries(
    Object.entries(obj || {}).filter(([key]) => predicate(key)),
  ) as T;
};

export async function readDirectoryFiles(
  appDirectory: string,
  directory: string,
  relativeDistPath: string,
): Promise<FileDetails[]> {
  const filesList: FileDetails[] = [];

  async function readFiles(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '_app.ts') continue;

      const resourcePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await readFiles(resourcePath);
      } else {
        const source = await fs.readFile(resourcePath, 'utf8');
        const relativePath = path.relative(directory, resourcePath);
        const parsedPath = path.parse(relativePath);

        const targetDir = path.join(
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
        const typesFilePath = path.join(
          `./${relativeDistPath}`,
          relativePathFromAppDirectory,
          `${name}.d.ts`,
        );
        const relativeTargetDistDir = `./${typesFilePath}`;
        const exportKey = path.join(parsedPath.dir, name);

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
    }
  }

  await readFiles(directory);
  return filesList;
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

    packageJson.exports = filterObjectKeys(
      packageJson.exports,
      key => !key.startsWith(EXPORT_PREFIX),
    );

    if (packageJson.typesVersions?.['*']) {
      packageJson.typesVersions['*'] = filterObjectKeys(
        packageJson.typesVersions['*'],
        key => !key.startsWith(TYPE_PREFIX),
      );
    }

    const mergedPackage = deepMerge(
      packageJson,
      {
        exports: files.reduce(
          (acc, file) => {
            const exportKey = `${EXPORT_PREFIX}${file.exportKey}`;
            const jsFilePath = `./${file.targetDir}`;
            return deepMerge(acc, {
              [exportKey]: {
                import: jsFilePath,
                types: jsFilePath.replace('js', 'd.ts'),
              },
            });
          },
          {
            './plugin': {
              require: `./${relativeDistPath}/${PLUGIN_DIR}/index.js`,
              types: `./${relativeDistPath}/${PLUGIN_DIR}/index.d.ts`,
            },
            './runtime': {
              import: `./${relativeDistPath}/${RUNTIME_DIR}/index.js`,
              types: `./${relativeDistPath}/${RUNTIME_DIR}/index.d.ts`,
            },
          },
        ),
        typesVersions: {
          '*': files.reduce(
            (acc, file) => {
              const typeFilePath = `./${file.targetDir}`.replace('js', 'd.ts');
              return deepMerge(acc, {
                [`${TYPE_PREFIX}${file.exportKey}`]: [typeFilePath],
              });
            },
            {
              runtime: [`./${relativeDistPath}/${RUNTIME_DIR}/index.d.ts`],
              plugin: [`./${relativeDistPath}/${PLUGIN_DIR}/index.d.ts`],
            },
          ),
        },
        files: [
          `${relativeDistPath}/${CLIENT_DIR}/**/*`,
          `${relativeDistPath}/${RUNTIME_DIR}/**/*`,
          `${relativeDistPath}/${PLUGIN_DIR}/**/*`,
        ],
      },
      {
        array: 'append',
        dedupe: true,
      },
    );

    await fs.promises.writeFile(
      packagePath,
      JSON.stringify(mergedPackage, null, 2),
    );
  } catch (error) {
    logger.error(`package.json update failed: ${error}`);
  }
}

export async function copyFiles(from: string, to: string) {
  if (await fs.pathExists(from)) {
    await fs.copy(from, to);
  }
}

async function clientGenerator(draftOptions: APILoaderOptions) {
  const sourceList = await readDirectoryFiles(
    draftOptions.appDir,
    draftOptions.lambdaDir,
    draftOptions.relativeDistPath,
  );

  const getClitentCode = async (resourcePath: string, source: string) => {
    const warning = `The file ${resourcePath} is not allowd to be imported in src directory, only API definition files are allowed.`;

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
        await copyFiles(
          source.relativeTargetDistDir,
          source.targetDir.replace(`js`, 'd.ts'),
        );
      }
    }
    logger.info(`Client bundle generate succeed`);
  } catch (error) {
    logger.error(`Client bundle generate failed: ${error}`);
  }

  setPackage(sourceList, draftOptions.appDir, draftOptions.relativeDistPath);
}

export default clientGenerator;
