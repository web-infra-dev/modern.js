import fs from 'fs';
import path from 'path';
import { createDebugger } from '@modern-js/utils';

export const debug: any = createDebugger('test');

interface TSConfig {
  extends?: string;
  compilerOptions?: Record<string, any>;
}

/**
 * Read `compilerOptions` in the current pwd's tsconfig.json file
 */
export const readCompilerOptions = (
  pwd: string = process.cwd(),
  filename = 'tsconfig.json',
): TSConfig['compilerOptions'] => {
  let tsConfig: TSConfig = {};
  let extendedCompilerOptions: TSConfig['compilerOptions'] = {};
  let tsconfigFile = '';

  try {
    const maybeTsconfigFile = path.join(pwd, filename);

    if (fs.existsSync(maybeTsconfigFile)) {
      tsconfigFile = maybeTsconfigFile;
    } else {
      tsconfigFile = require.resolve(filename);
    }

    ({ config: tsConfig } = require('typescript').parseConfigFileTextToJson(
      tsconfigFile,
      fs.readFileSync(tsconfigFile, 'utf8'),
    ));
  } catch (e) {
    return {};
  }

  if (tsConfig.extends) {
    extendedCompilerOptions = readCompilerOptions(
      path.dirname(tsconfigFile),
      tsConfig.extends,
    );
  }

  return {
    ...extendedCompilerOptions,
    ...tsConfig.compilerOptions,
  };
};

export const getModuleNameMapper = (alias: any) =>
  Object.keys(alias).reduce((memo, cur) => {
    const aliasValue = Array.isArray(alias[cur]) ? alias[cur] : [alias[cur]];

    const isFile = aliasValue.some((s: string) => s.endsWith('.js'));

    // It's special for if using @modern-js/runtime alias other module @modern-js/runtime/model would not work.
    if (cur === '@modern-js/runtime$') {
      memo[`.+${cur}`] = aliasValue[0];

      return memo;
    }

    if (isFile) {
      memo[cur] = aliasValue[0];
    }

    const key = `^${cur}/(.*)$`;
    const value = path.normalize(`${aliasValue}/$1`);
    memo[key] = value;
    return memo;
  }, {} as any);
