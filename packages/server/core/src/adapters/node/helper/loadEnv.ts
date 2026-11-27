import path from 'path';
import { fs, dotenv, dotenvExpand } from '@modern-js/utils';
import type { ServerBaseOptions } from '../../../serverBase';

// A detached dotenv expansion must retain Windows' case-insensitive key lookup.
function envForExpansion(values: Record<string, string>) {
  if (process.platform !== 'win32') {
    return values;
  }
  const names = new Map(
    Object.keys(values).map(key => [key.toUpperCase(), key]),
  );
  const lookup = (key: string | symbol) =>
    typeof key === 'string' ? (names.get(key.toUpperCase()) ?? key) : key;
  return new Proxy(values, {
    get: (target, key) => Reflect.get(target, lookup(key)),
    getOwnPropertyDescriptor: (target, key) =>
      Reflect.getOwnPropertyDescriptor(target, lookup(key)),
  });
}

async function loadEnvFile(file: string, override: boolean) {
  if (!(await fs.pathExists(file)) || (await fs.stat(file)).isDirectory()) {
    return;
  }

  // Expand against the environment before dotenv populates it with raw values.
  const { parsed } = dotenv.config({ path: file, quiet: true, processEnv: {} });
  if (!parsed) {
    return;
  }

  const fileEnv = envForExpansion(parsed);
  const processEnv: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !(override && Object.hasOwn(fileEnv, key))) {
      processEnv[key] = value;
    }
  }
  dotenvExpand.expand({
    parsed: fileEnv,
    processEnv: envForExpansion(processEnv),
  });
  Object.assign(process.env, parsed);
}

/** 读取 .env.{process.env.MODERN_ENV} 文件，加载环境变量 */
export async function loadServerEnv({ pwd }: ServerBaseOptions) {
  const serverEnv = process.env.MODERN_ENV;
  await loadEnvFile(path.resolve(pwd, '.env'), false);
  await loadEnvFile(path.resolve(pwd, `.env.${serverEnv}`), true);
}
