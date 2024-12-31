import path from 'path';
import { fs, logger } from '@modern-js/utils';
import { API_APP_PACKAGE_NAME, API_APP_PREFIX } from './serverPlugin';

async function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageData = await fs.readFile(packagePath, 'utf8');
  return JSON.parse(packageData);
}

function replaceContent(source: string, packageName: string, prefix: string) {
  const updatedSource = source
    .replace(new RegExp(API_APP_PACKAGE_NAME, 'g'), packageName)
    .replace(new RegExp(API_APP_PREFIX, 'g'), prefix);
  return updatedSource;
}

async function pluginGenerator(prefix: string) {
  try {
    const packageJson = await readPackageJson();
    const cwd = process.cwd();
    const pluginPath = path.resolve(cwd, './dist', 'server-plugin');

    if (!fs.existsSync(pluginPath)) {
      fs.mkdirSync(pluginPath);
    }

    const pluginTemplate = await fs.readFile(
      path.resolve(__dirname, 'serverPlugin.js'),
      'utf8',
    );
    const updatedPlugin = replaceContent(
      pluginTemplate,
      packageJson.name,
      prefix,
    );

    fs.writeFileSync(path.join(pluginPath, 'index.js'), updatedPlugin);

    logger.info('Server plugin generate succeed');
  } catch (error) {
    logger.error('Server plugin generate failed:', error);
  }
}

export default pluginGenerator;
