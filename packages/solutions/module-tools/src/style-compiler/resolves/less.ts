import path from 'path';
import { fs } from '@modern-js/utils';
import less from 'less';
import { ResolveItemParams, SingleFileCompilerResult } from '../types';
import { postcssResolve } from './postcss';

const lessToCss = async (lessCode: string, params: ResolveItemParams) => {
  const { file, options } = params;

  const data = lessCode.replace(/^\uFEFF/, '');
  const sourceMapOptions = {
    outputFilename: `${file}.map`,
    outputSourceFiles: true,
  };
  try {
    const lessResult = await less.render(data, {
      // [rootPath] https://lesscss.org/usage/#less-options-rootpath
      // TODO: support any path and url
      rootpath: './',
      relativeUrls: true,
      filename: path.resolve(file),
      paths: [path.dirname(file)],
      sourceMap: options.less?.enableSourceMap ? sourceMapOptions : false,
      ...options.less?.lessOption,
    } as Less.Options);
    return {
      code: 0,
      filename: file,
      content: lessResult.css,
      error: null,
      sourceMap: lessResult.map,
      sourceMapFileName: '',
    };
  } catch (error: any) {
    return {
      code: 1,
      filename: file,
      content: '',
      error: error.message,
    };
  }
};

const generateContent = async (lessCode: string, params: ResolveItemParams) => {
  const lessCompilerResult = await lessToCss(lessCode, params);

  if (lessCompilerResult.code === 1) {
    return lessCompilerResult as SingleFileCompilerResult;
  }

  return postcssResolve(lessCompilerResult.content, params, {
    sourcemapContent: lessCompilerResult.sourceMap,
  });
};

export const lessResolve = async (params: ResolveItemParams) => {
  const { file, options, stylesDir, outDir } = params;
  const originalLessCode = fs.readFileSync(file, 'utf-8');
  const relativePath = path.relative(stylesDir, file);
  const outFile = path.join(outDir, relativePath);
  // 如果没有配置 less，则认为没有开启 less 功能
  if (!options.less) {
    return {
      code: 0,
      filename: outFile,
      content: originalLessCode,
      error: null,
    } as SingleFileCompilerResult;
  }

  return generateContent(originalLessCode, params);
};
