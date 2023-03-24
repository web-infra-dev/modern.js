import {
  CORE_JS_DIR_PATH,
  SWC_HELPERS_DIR_PATH,
} from '@modern-js/builder-plugin-swc-base';
import { Compiler as RawCompiler, Output } from '@modern-js/swc-plugins';
import { normalizeConfig, TransformConfig } from './config';

export {
  minify,
  minifySync,
  minifyCss,
  minifyCssSync,
} from '@modern-js/swc-plugins';

export class Compiler extends RawCompiler {
  config: TransformConfig;

  constructor(config: TransformConfig) {
    config.extensions!.lockCorejsVersion ??= {
      corejs: CORE_JS_DIR_PATH,
      swcHelpers: SWC_HELPERS_DIR_PATH,
    };
    const normalized = normalizeConfig(config);
    super(normalized);
    this.config = normalized;
  }
}

export function transformSync(
  config: TransformConfig,
  filename: string,
  code: string,
  map?: string,
): Output {
  const compiler = new Compiler(config);

  return compiler.transformSync(filename, code, map);
}

export function transform(
  config: TransformConfig,
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
