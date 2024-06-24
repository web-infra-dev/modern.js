import path from 'path';
import { fs, dotenv, dotenvExpand } from '@modern-js/utils';
import type { ServerBaseOptions } from '../../../serverBase';

/** 读取 .env.{process.env.MODERN_ENV} 文件，加载环境变量 */
export async function loadServerEnv(options: ServerBaseOptions) {
  const { pwd } = options;
  const serverEnv = process.env.MODERN_ENV;
  const defaultEnvPath = path.resolve(pwd, `.env`);
  const serverEnvPath = path.resolve(pwd, `.env.${serverEnv}`);
  for (const envPath of [serverEnvPath, defaultEnvPath]) {
    if (
      (await fs.pathExists(envPath)) &&
      !(await fs.stat(envPath)).isDirectory()
    ) {
      const envConfig = dotenv.config({ path: envPath });
      dotenvExpand(envConfig);
    }
  }
}
