import path from 'path';
import { fs, logger } from '@modern-js/utils';
import { API_APP_PACKAGE_NAME, API_APP_PREFIX } from './server-plugin';

async function pluginGenerator(prefix: string) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageData = await fs.readFile(packagePath, 'utf8');
  const packageJson = JSON.parse(packageData);

  const cwd = process.cwd();
  const pluginPath = path.resolve(cwd, './dist', 'server-plugin');
  if (!fs.existsSync(pluginPath)) {
    fs.mkdirSync(pluginPath);
  }

  let source = await fs.readFile(
    path.resolve(__dirname, 'server-plugin.js'),
    'utf8',
  );

  source = source.replace(
    new RegExp(API_APP_PACKAGE_NAME, 'g'),
    packageJson.name,
  );
  source = source.replace(new RegExp(API_APP_PREFIX, 'g'), prefix);

  fs.writeFileSync(path.join(pluginPath, 'index.js'), source);

  logger.info(`Generate server-plugin succeed`);
}

export default pluginGenerator;
