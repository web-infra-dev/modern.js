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
      `${relativeDistPath}/${CLIENT_DIR}/**/*`,
      `${relativeDistPath}/${RUNTIME_DIR}/**/*`,
      `${relativeDistPath}/${PLUGIN_DIR}/**/*`,
    ];

    const typesVersions = {
      '*': files.reduce(
        (acc, file) => {
          const typeFilePath = `./${file.targetDir}`.replace('js', 'd.ts');
          return {
            ...acc,
            [`${TYPE_PREFIX}${file.exportKey}`]: [typeFilePath],
          };
        },
        {
          [RUNTIME_DIR]: [`./${relativeDistPath}/${RUNTIME_DIR}/index.d.ts`],
          [PLUGIN_DIR]: [`./${relativeDistPath}/${PLUGIN_DIR}/index.d.ts`],
        },
      ),
    };

    const exports = files.reduce(
      (acc, file) => {
        const exportKey = `${EXPORT_PREFIX}${file.exportKey}`;
        const jsFilePath = `./${file.targetDir}`;

        return {
          ...acc,
          [exportKey]: {
            import: jsFilePath,
            types: jsFilePath.replace(/\.js$/, '.d.ts'),
          },
        };
      },
      {
        [`./${PLUGIN_DIR}`]: {
          require: `./${relativeDistPath}/${PLUGIN_DIR}/index.js`,
          types: `./${relativeDistPath}/${PLUGIN_DIR}/index.d.ts`,
        },
        [`./${RUNTIME_DIR}`]: {
          import: `./${relativeDistPath}/${RUNTIME_DIR}/index.js`,
          types: `./${relativeDistPath}/${RUNTIME_DIR}/index.d.ts`,
        },
      },
    );

    mergePackageJson(packageJson, addFiles, typesVersions, exports);

    await fs.promises.writeFile(
      packagePath,
      JSON.stringify(packageJson, null, 2),
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
