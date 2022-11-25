import { Compiler as RawCompiler, Output } from '@modern-js/swc-plugins';
import { normalizeConfig, TransformConfig } from './config';

export { minify, minifySync } from '@modern-js/swc-plugins';

export class Compiler extends RawCompiler {
  config: TransformConfig;

  constructor(config: TransformConfig) {
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
