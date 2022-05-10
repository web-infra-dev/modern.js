import path from 'path';
import { fs } from '@modern-js/utils';
import sass from 'sass';
import { toString, merge } from '@modern-js/utils/lodash';
import { ResolveItemParams, SingleFileCompilerResult } from '../types';
import { postcssResolve } from './postcss';

const sassToCss = (
  sassCode: string,
  params: ResolveItemParams,
  { outFile }: { outFile: string },
) => {
  const { file, options } = params;
  const ext = path.extname(file);
  const enableIndentedSyntax = ext === '.sass';
  const config = {
    file,
    data: sassCode,
    indentedSyntax: enableIndentedSyntax,
    outFile,
  };
  const sassConfig = merge(config, options.sass);

  try {
    const sassResult = sass.renderSync(sassConfig);
    return {
      code: 0,
      content: sassResult.css.toString(),
      filename: outFile,
      error: null,
      sourceMap: toString(sassResult.map),
    } as SingleFileCompilerResult;
  } catch (error: any) {
    return {
      code: 1,
      content: '',
      filename: outFile,
      error: error.message,
    } as SingleFileCompilerResult;
  }
};

const generateContent = async (
  sassCode: string,
  params: ResolveItemParams,
  option: { outFile: string },
) => {
  const sassCompilerResult = sassToCss(sassCode, params, option);

  if (sassCompilerResult.code === 1) {
    return sassCompilerResult;
  }

  return postcssResolve(sassCompilerResult.content, params, {
    sourcemapContent: sassCompilerResult.sourceMap || '',
  });
};

export const sassResolve = async (params: ResolveItemParams) => {
  const { file, options, stylesDir, outDir } = params;
  const originSassCode = fs.readFileSync(file, 'utf-8');
  const relativePath = path.relative(stylesDir, file);
  const outFile = path.join(outDir, relativePath);
  if (!options.sass) {
    return {
      code: 0,
      filename: outFile,
      content: originSassCode,
      error: null,
      sourceMap: '',
      sourceMapFile: '',
    } as SingleFileCompilerResult;
  }
  return generateContent(originSassCode, params, { outFile });
};
