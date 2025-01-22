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
          `./${relativeDistPath}/client`,
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
  relativeApiPath: string,
) {
  try {
    const packagePath = path.resolve(appDirectory, './package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    packageJson.exports = packageJson.exports || {};
    packageJson.typesVersions = packageJson.typesVersions || { '*': {} };

    files.forEach(file => {
      const exportKey = `./api/${file.exportKey}`;
      const jsFilePath = `./${file.targetDir}`;
      const typePath = file.relativeTargetDistDir;

      packageJson.exports[exportKey] = {
        import: jsFilePath,
        types: typePath,
      };

      packageJson.typesVersions['*'][`api/${file.exportKey}`] = [typePath];
    });

    packageJson.exports['./plugin'] = {
      require: `./${relativeDistPath}/plugin/index.js`,
      types: `./${relativeDistPath}/plugin/index.d.ts`,
    };

    packageJson.exports['./runtime'] = {
      import: `./${relativeDistPath}/runtime/index.js`,
      types: `./${relativeDistPath}/runtime/index.d.ts`,
    };
    packageJson.typesVersions['*'].runtime = [
      `./${relativeDistPath}/runtime/index.d.ts`,
    ];
    packageJson.typesVersions['*'].plugin = [
      `./${relativeDistPath}/plugin/index.d.ts`,
    ];

    packageJson.files = [
      `./${relativeDistPath}/client/**/*`,
      `./${relativeDistPath}/${relativeApiPath}/**/*`,
      `./${relativeDistPath}/runtime/**/*`,
      `./${relativeDistPath}/plugin/**/*`,
    ];

    await fs.promises.writeFile(
      packagePath,
      JSON.stringify(packageJson, null, 2),
    );
  } catch (error) {
    logger.error(`package.json update failed: ${error}`);
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
      }
    }
    logger.info(`Client bundle generate succeed`);
  } catch (error) {
    logger.error(`Client bundle generate failed: ${error}`);
  }

  setPackage(
    sourceList,
    draftOptions.appDir,
    draftOptions.relativeDistPath,
    draftOptions.relativeApiPath,
  );
}

export default clientGenerator;
