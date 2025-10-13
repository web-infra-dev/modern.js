import path from 'path';
import { fs, logger, normalizeToPosixPath } from '@modern-js/utils';
import {
  API_DIR,
  DIST_DIR,
  LAMBDA_DIR,
  PACKAGE_NAME,
  PREFIX,
} from './crossProjectApiPlugin';

function replaceContent(
  source: string,
  packageName: string,
  prefix: string,
  relativeDistPath: string,
  relativeApiPath: string,
  relativeLambdaPath: string,
) {
  const updatedSource = source
    .replace(new RegExp(PACKAGE_NAME, 'g'), packageName)
    .replace(new RegExp(PREFIX, 'g'), prefix)
    .replace(new RegExp(DIST_DIR, 'g'), normalizeToPosixPath(relativeDistPath))
    .replace(new RegExp(API_DIR, 'g'), normalizeToPosixPath(relativeApiPath))
    .replace(
      new RegExp(LAMBDA_DIR, 'g'),
      normalizeToPosixPath(relativeLambdaPath),
    );
  return updatedSource;
}

async function pluginGenerator({
  prefix,
  appDirectory,
  relativeDistPath,
  relativeApiPath,
  relativeLambdaPath,
}: {
  prefix: string;
  appDirectory: string;
  relativeDistPath: string;
  relativeApiPath: string;
  relativeLambdaPath: string;
}) {
  try {
    const packageContent = await fs.readFile(
      path.resolve(appDirectory, './package.json'),
      'utf8',
    );
    const packageJson = JSON.parse(packageContent);

    const pluginDir = path.resolve(
      appDirectory,
      `./${relativeDistPath}`,
      'plugin',
    );
    const pluginPath = path.join(pluginDir, 'index.js');

    const pluginTemplate = await fs.readFile(
      path.resolve(__dirname, 'crossProjectApiPlugin.js'),
      'utf8',
    );
    const updatedPlugin = replaceContent(
      pluginTemplate,
      packageJson.name,
      prefix,
      relativeDistPath,
      relativeApiPath,
      relativeLambdaPath,
    );

    await fs.ensureFile(pluginPath);
    await fs.writeFile(pluginPath, updatedPlugin);

    const typeContent = `import type { AppTools, CliPlugin } from '@modern-js/app-tools';
      export declare const crossProjectApiPlugin: () => CliPlugin<AppTools>`;

    const pluginTypePath = path.join(pluginDir, 'index.d.ts');
    await fs.ensureFile(pluginTypePath);
    await fs.writeFile(pluginTypePath, typeContent);

    logger.info('Api plugin generate succeed');
  } catch (error) {
    logger.error('Api plugin generate failed:', error);
  }
}

export default pluginGenerator;
