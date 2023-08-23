import { createBuilder } from '@modern-js/builder';
import {
  builderRspackProvider,
  type BuilderConfig as RspackBuilderConfig,
} from '@modern-js/builder-rspack-provider';
import {
  builderWebpackProvider,
  type BuilderConfig as WebpackBuilderConfig,
} from '@modern-js/builder-webpack-provider';
import type { ProviderInstance } from '@modern-js/builder-shared';
import { BundlerType } from './types';

type ReturnPromiseType<T extends (...args: any) => any> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

type Compiler = ReturnPromiseType<ProviderInstance['createCompiler']>;

export async function createCompiler(
  bundler: BundlerType,
  builderConfig: WebpackBuilderConfig | RspackBuilderConfig,
): Promise<Compiler> {
  const builder = await createBuilder(
    bundler === 'webpack'
      ? builderWebpackProvider({
          builderConfig: builderConfig as WebpackBuilderConfig,
        })
      : builderRspackProvider({
          builderConfig: builderConfig as RspackBuilderConfig,
        }),
    {},
  );

  const compiler = await builder.createCompiler();
  return compiler;
}
