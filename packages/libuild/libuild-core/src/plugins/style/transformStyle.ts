import path from 'path';
import { PartialMessage } from 'esbuild';
import { resolvePathAndQuery } from '@modern-js/libuild-utils';
import { ILibuilder, Source } from '../../types';
import { LibuildError } from '../../error';
import { postcssTransformer } from './postcssTransformer';
import { lessRender } from './lessRender';
import { sassRender } from './sassRender';

const cssLangs = `\\.(css|less|sass|scss)($|\\?)`;
const cssLangRE = new RegExp(cssLangs);

const cssRender: PreprocessRender = async function (this: ILibuilder, content: string) {
  return {
    css: content,
  };
};
export interface PreprocessRender {
  (
    content: string,
    stdinPath: string,
    stdinDir: string,
    preprocessOptions: any,
    resolvePathMap: Map<string, string>
  ): Promise<{
    css: Buffer | String;
    errors?: PartialMessage[];
    warnings?: PartialMessage[];
    map?: Buffer | string;
  }>;
}

const renderMap: Record<string, Function> = {
  less: lessRender,
  sass: sassRender,
  scss: sassRender,
  css: cssRender,
};
export async function transformStyle(this: ILibuilder, source: Source) {
  const lang = source.path.match(cssLangRE)?.[1];
  if (!lang) {
    throw new LibuildError('UNSUPPORTED_CSS_LANG', `not supported css lang${lang}`);
  }
  const { less, sass } = this.config.style;
  const options = lang === 'less' ? less?.lessOptions : sass?.sassOptions;
  const additionalData = lang === 'less' ? less?.additionalData : sass?.additionalData;
  const implementation = lang === 'less' ? less?.implementation : sass?.implementation;
  const preprocessRender = renderMap[lang];
  const { originalFilePath } = resolvePathAndQuery(source.path);
  const stdinDir = path.dirname(originalFilePath);

  const resolvePathMap = new Map<string, string>();
  let content = '';
  if (typeof additionalData === 'string') {
    content = `${additionalData}\n`;
  } else if (typeof additionalData === 'function') {
    content = `${additionalData(originalFilePath)}\n`;
  }
  content += source.code;

  const renderResult = await preprocessRender.apply(this, [
    content,
    originalFilePath,
    stdinDir,
    options,
    resolvePathMap,
    implementation,
  ]);
  const css = renderResult.css.toString();
  const { code, loader } = await postcssTransformer(css ?? '', originalFilePath, this);
  return {
    code,
    loader,
  };
}
