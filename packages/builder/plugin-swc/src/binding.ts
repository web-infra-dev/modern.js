import { Compiler as RawCompiler, Output } from '@modern-js/swc-plugins';
import { logger } from '@modern-js/utils';
import { TransformConfig } from './types';
import { CORE_JS_DIR_PATH, SWC_HELPERS_DIR_PATH } from './constants';

export {
  minify,
  minifySync,
  minifyCss,
  minifyCssSync,
} from '@modern-js/swc-plugins';

export function applyExtensionsConfig(opt: TransformConfig): TransformConfig {
  // set lockCoreVersion config
  const config = {
    ...opt,
    extensions: {
      ...opt.extensions,
      lockCorejsVersion: {
        ...(opt.extensions?.lockCorejsVersion || {}),
        corejs: CORE_JS_DIR_PATH,
        swcHelpers: SWC_HELPERS_DIR_PATH,
      },
    },
  };

  return config;
}

export class Compiler extends RawCompiler {
  config: TransformConfig;

  constructor(config: TransformConfig) {
    const finalConfig = applyExtensionsConfig(config);

    if (finalConfig.jsc?.target && finalConfig.env?.targets) {
      logger.warn(
        '[builder-plugin-swc]: Do not use `jsc.target` and `env.targets` at the same time. Use `env.targets` instead',
      );

      delete finalConfig.jsc.target;
    }

    super(finalConfig);
    this.config = finalConfig;
  }
}

export function transformSync(
  config: Required<TransformConfig>,
  filename: string,
  code: string,
  map?: string,
): Output {
  const compiler = new Compiler(config);

  return compiler.transformSync(filename, code, map);
}

export function transform(
  config: Required<TransformConfig>,
  filename: string,
  code: string,
  map?: string,
): Promise<Output> {
  let compiler;
  try {
    compiler = new Compiler(config);
  } catch (e) {
    throw new Error(`[builder-plugin-swc] Failed to initialize config: \n${e}`);
  }
  return compiler.transform(filename, code, map);
}
