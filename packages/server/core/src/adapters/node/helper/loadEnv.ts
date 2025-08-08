import path from 'path';
import { fs, dotenv, dotenvExpand } from '@modern-js/utils';
import type { ServerBaseOptions } from '../../../serverBase';

/** 读取 .env.{process.env.MODERN_ENV} 文件，加载环境变量 */
export async function loadServerEnv(options: ServerBaseOptions) {
  const { pwd } = options;
  const serverEnv = process.env.MODERN_ENV;
  const defaultEnvPath = path.resolve(pwd, `.env`);
  const serverEnvPath = path.resolve(pwd, `.env.${serverEnv}`);

  if (
    (await fs.pathExists(defaultEnvPath)) &&
    !(await fs.stat(defaultEnvPath)).isDirectory()
  ) {
    const envConfig = dotenv.config({ path: defaultEnvPath });
    dotenvExpand(envConfig);
  }

  if (
    (await fs.pathExists(serverEnvPath)) &&
    !(await fs.stat(serverEnvPath)).isDirectory()
  ) {
    const envConfig = dotenv.config({ path: serverEnvPath, override: true });
    if (envConfig.parsed) {
      Object.assign(process.env, envConfig.parsed);
    }

    dotenvExpand(envConfig);
  }
}
