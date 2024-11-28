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
  target: string;
  httpMethodDecider?: HttpMethodDecider;
  domain?: string;
};

async function readDirectoryFiles(appDirectory: string, directory: string) {
  const filesList: {
    resourcePath: string;
    source: string;
    targetDir: string;
    name: string;
    absTargetDir: string;
    relativeTargetDistDir: string;
    exportKey: string;
  }[] = [];

  async function readFiles(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      // if (entry.name === '_app.ts') {
      //   continue;
      // }

      const resourcePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await readFiles(resourcePath);
      } else {
        const source = await fs.readFile(resourcePath, 'utf8');
        const targetDir = path.join(
          './dist/client',
          path.relative(directory, currentPath),
          entry.name.replace('.ts', '.js'),
        );
        const name = path.basename(entry.name, '.ts');
        const absTargetDir = path.resolve(targetDir);

        const relativePathFromAppDirectory = path.relative(
          appDirectory,
          currentPath,
        );
        const typesFilePath = path.join(
          './dist',
          relativePathFromAppDirectory,
          `${name}.d.ts`,
        );
        const relativeTargetDistDir = `./${typesFilePath}`;

        const relativePath = path.relative(directory, resourcePath);
        const parsedPath = path.parse(relativePath);
        const exportKey = path.join(parsedPath.dir, parsedPath.name);

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
) {
  const packagePath = path.join(process.cwd(), 'package.json');
  try {
    const packageData = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageData);

    if (!packageJson.exports) {
      packageJson.exports = {};
    }

    files.forEach(file => {
      const exportKey = `./${file.exportKey}`;
      const jsFilePath = `./${file.targetDir}`;

      packageJson.exports[exportKey] = {
        import: jsFilePath,
        types: file.relativeTargetDistDir,
      };
    });

    packageJson.exports['./server-plugin'] = `./dist/server-plugin/index.js`;

    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
    logger.info(`Update package.json succeed`);
  } catch (error) {
    logger.error(`Update package.json error: ${error}`);
  }
}

async function clientGenerator(draftOptions: APILoaderOptions) {
  const sourceList = await readDirectoryFiles(
    draftOptions.appDir,
    draftOptions.lambdaDir,
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
      target: draftOptions.target,
      port: Number(draftOptions.port),
      source,
      resourcePath,
      httpMethodDecider: draftOptions.httpMethodDecider,
      domain: draftOptions.domain,
    };

    const { lambdaDir } = draftOptions as any;
    if (!resourcePath.startsWith(lambdaDir)) {
      logger.warn(warning);
      return;
    }

    options.requireResolve = require.resolve;

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
    logger.info(`Generate client bundle succeed`);
  } catch (error) {
    logger.error(`Generate Client bundle error: ${error}`);
  }

  setPackage(sourceList);
}

export default clientGenerator;
