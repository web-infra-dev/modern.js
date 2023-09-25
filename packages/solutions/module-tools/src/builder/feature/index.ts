import { HookList, Context } from '../../types';
import { getProjectTsconfig } from '../../utils/dts';
import { formatCjs } from './format-cjs';
import { css } from './style';
import { minify } from './terser';
import { asset } from './asset';

export async function getInternalList(context: Context): Promise<HookList> {
  const internal = [];
  const { config } = context;

  internal.push(asset, css);

  if (
    config.buildType === 'bundle' &&
    config.format === 'cjs' &&
    config.splitting
  ) {
    internal.push(formatCjs);
  }

  if (config.buildType === 'bundleless') {
    const { redirect } = await import('./redirect');
    const { json } = await import('./json');
    internal.push(redirect, json);
  }

  if (config.minify && config.minify !== 'esbuild') {
    internal.push(minify);
  }

  const userTsconfig = await getProjectTsconfig(context.config.tsconfig);
  const emitDecoratorMetadata =
    userTsconfig?.compilerOptions?.emitDecoratorMetadata ?? false;

  const { transformImport, transformLodash, externalHelpers, format, target } =
    context.config;

  const enbaleSwcTransform =
    transformImport.length > 0 ||
    transformLodash ||
    externalHelpers ||
    emitDecoratorMetadata;
  const enableSwcRenderChunk = enbaleSwcTransform
    ? format === 'umd'
    : format === 'umd' || target === 'es5';
  if (enbaleSwcTransform) {
    const { swcTransform } = await import('./swc');
    internal.push(swcTransform(userTsconfig));
  }

  if (enableSwcRenderChunk) {
    const { swcRenderChunk } = await import('./swc');
    internal.push(swcRenderChunk);
  }

  return internal;
}
