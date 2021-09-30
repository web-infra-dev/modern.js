import { fs } from '@modern-js/utils';
import { cssResolve } from './resolves/css';
import { lessResolve } from './resolves/less';
import { sassResolve } from './resolves/sass';
import {
  ResolveParams,
  SingleFileCompilerResult,
  ICompilerResult,
} from './types';
import { isCssRule, isLessRule, isSassRule } from './utils/cssRule';
import { generateOutputFile } from './resolves/utils';

export async function resolveFiles(
  params: ResolveParams & { enableVirtualDist: true },
): Promise<ICompilerResult>;
export async function resolveFiles(
  params: ResolveParams & { enableVirtualDist: false },
): Promise<undefined>;

export async function resolveFiles(params: ResolveParams) {
  const { files, enableVirtualDist } = params;

  const results: SingleFileCompilerResult[] = [];
  for (const file of files) {
    let result: SingleFileCompilerResult;
    if (isLessRule(file)) {
      result = await lessResolve({ file, ...params });
    } else if (isSassRule(file)) {
      result = await sassResolve({ file, ...params });
    } else if (isCssRule(file)) {
      result = await cssResolve({ file, ...params });
    } else {
      // 如果是不识别的文件，则不做任何处理
      result = {
        code: 0,
        filename: file,
        content: fs.readFileSync(file, 'utf-8'),
        error: null,
      };
    }

    results.push(result);
    if (!enableVirtualDist && result.code === 0) {
      generateOutputFile(result.filename, result.content, params);
    }
  }

  if (enableVirtualDist) {
    return {
      code: results.some(result => result.code === 1) ? 1 : 0,
      dists: results.filter(result => result.code === 0),
      errors: results.filter(result => result.code === 1),
    };
  }

  return undefined;
}
