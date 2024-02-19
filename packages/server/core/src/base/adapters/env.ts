import path from 'path';
import { fs, dotenv, dotenvExpand } from '@modern-js/utils';
import { ServerBaseOptions } from '../types';

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
