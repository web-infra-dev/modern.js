import { Compiler as RawCompiler, Output } from '@modern-js/swc-plugins';
import { TransformConfig } from './types';

export {
  minify,
  minifySync,
  minifyCss,
  minifyCssSync,
} from '@modern-js/swc-plugins';

export class Compiler extends RawCompiler {
  config: TransformConfig;

  constructor(finalConfig: TransformConfig) {
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
