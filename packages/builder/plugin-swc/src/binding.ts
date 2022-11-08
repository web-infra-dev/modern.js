import {
  Compiler as RawCompiler,
  Output,
  minify as minifyBinding,
  minifySync as minifySyncBinding,
} from '@modern-js/swc-plugins';
import type { JsMinifyOptions } from '@swc/core';
import { normalizeConfig, toBindingConfig, TransformConfig } from './config';

export class Compiler extends RawCompiler {
  config: TransformConfig;

  constructor(config: Partial<TransformConfig>) {
    const normalized = normalizeConfig(config);
    const c = toBindingConfig(normalized);
    super(c);
    this.config = normalized;
  }
}

export function transformSync(
  config: Partial<TransformConfig>,
  filename: string,
  code: string,
  map?: string,
): Output {
  const compiler = new Compiler(config);

  return compiler.transformSync(filename, code, map);
}

export function transform(
  config: Partial<TransformConfig>,
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

export async function minify(
  config: Partial<JsMinifyOptions>,
  filename: string,
  code: string,
  map?: string,
): Promise<Output> {
  return await minifyBinding(JSON.stringify(config), filename, code, map);
}

export async function minifySync(
  config: Partial<JsMinifyOptions>,
  filename: string,
  code: string,
  map?: string,
): Promise<Output> {
  return minifySyncBinding(JSON.stringify(config), filename, code, map);
}
