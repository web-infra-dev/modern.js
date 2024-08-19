import path from 'path';
import type { PartialMessage } from 'esbuild';
import type { ICompiler, Source } from '../../../types';
import { postcssTransformer } from './postcssTransformer';
import { lessRender } from './lessRender';
import { sassRender } from './sassRender';

const cssLangs = `\\.(css|less|sass|scss)($|\\?)`;
const cssLangRE = new RegExp(cssLangs);

const cssRender: PreprocessRender = async function (
  this: ICompiler,
  content: string,
) {
  return {
    css: content,
  };
};
export type PreprocessRender = (
  content: string,
  stdinPath: string,
  stdinDir: string,
  preprocessOptions: any,
  resolvePathMap: Map<string, string>,
  implementation?: object | string,
) => Promise<{
  css: Buffer | string;
  errors?: PartialMessage[];
  warnings?: PartialMessage[];
  map?: Buffer | string;
}>;

const renderMap: Record<string, PreprocessRender> = {
  less: lessRender,
  sass: sassRender,
  scss: sassRender,
  css: cssRender,
};
export async function transformStyle(this: ICompiler, source: Source) {
  const lang = source.path.match(cssLangRE)?.[1];
  if (!lang) {
    throw new Error(`UNSUPPORTED_CSS_LANG: not supported css lang${lang}`);
  }
  const { less, sass } = this.config.style;
  let options;
  let additionalData;
  let implementation;
  if (lang === 'less') {
    options = less?.lessOptions;
    additionalData = less?.additionalData;
    implementation = less?.implementation;
  }
  if (lang === 'scss' || lang === 'sass') {
    options = sass?.sassOptions;
    additionalData = sass?.additionalData;
    implementation = sass?.implementation;
  }

  const preprocessRender = renderMap[lang];
  const stdinDir = path.dirname(source.path);

  const resolvePathMap = new Map<string, string>();
  let content = '';
  if (typeof additionalData === 'string') {
    content = `${additionalData}\n`;
  } else if (typeof additionalData === 'function') {
    content = `${additionalData(source.path)}\n`;
  }
  content += source.code;

  const renderResult = await preprocessRender.apply(this, [
    content,
    source.path,
    stdinDir,
    options,
    resolvePathMap,
    implementation,
  ]);
  const css = renderResult.css.toString();
  const { code, loader } = await postcssTransformer(
    css ?? '',
    source.path,
    this,
  );
  return {
    code,
    loader,
  };
}
