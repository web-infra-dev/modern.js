import fs from 'fs';
import path from 'path';
import env from 'dotenv';
import envExpand from 'dotenv-expand';
import { DEFAULT_NODE_ENV } from '../constants/config';

interface SupportedLibuildEnv {
  name: LibuildEnvName;
  default: string;
}

export const LibuildEnv = {
  NODE_ENV: 'NODE_ENV',
  LIBUILD_ENV_DEBUG: 'LIBUILD_ENV_DEBUG',
} as const;

export type LibuildEnvName = keyof typeof LibuildEnv;

const debugging = process.env[LibuildEnv.LIBUILD_ENV_DEBUG] === 'true';

export const loadEnv = (projectRoot?: string): void => {
  const NODE_ENV = process.env.NODE_ENV || DEFAULT_NODE_ENV;

  const currProjectRoot = projectRoot ?? process.cwd();

  if (!NODE_ENV) {
    throw new Error('The NODE_ENV environment variable is required but was not specified.');
  }

  const envFile = path.join(currProjectRoot, '.env');

  const dotenvFiles = [`${envFile}.${NODE_ENV}.local`, `${envFile}.local`, `${envFile}.${NODE_ENV}`, envFile];

  dotenvFiles.forEach((dotenvFile) => {
    if (fs.existsSync(dotenvFile)) {
      envExpand(
        env.config({
          path: dotenvFile,
          debug: debugging,
        })
      );
    }
  });
};
export const getClientEnvironment = (projectRoot?: string) => {
  if (projectRoot) {
    loadEnv(projectRoot);
  }

  const LIBUILD_ENV = /^LIBUILD_/i;

  const SUPPORTED_LIBUILD_ENVS: SupportedLibuildEnv[] = [
    {
      name: LibuildEnv.LIBUILD_ENV_DEBUG,
      default: 'false',
    },
  ];

  const raw = Object.keys(process.env)
    .filter((key) => {
      return LIBUILD_ENV.test(key);
    })
    .reduce(
      (env, key) => {
        env[key as LibuildEnvName] = process.env[key]!;
        return env;
      },
      {
        ...SUPPORTED_LIBUILD_ENVS.reduce((acc, env) => {
          const { name: envName, default: defaultValue } = env;
          acc[envName] = process.env[envName] ?? defaultValue;
          return acc;
        }, {} as Record<LibuildEnvName, string>),
      } as Record<LibuildEnvName, string>
    );

  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key as LibuildEnvName]);
      return env;
    }, {} as Record<string, string>),
  };

  return { raw, stringified };
};
