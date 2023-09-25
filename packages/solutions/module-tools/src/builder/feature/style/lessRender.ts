import { ICompiler } from '../../../types';
import Less from '../../../../compiled/less';
import { loadProcessor } from './utils';
import { PreprocessRender } from './transformStyle';
import LessAliasesPlugin from './lessAliasPlugin';

export const lessRender: PreprocessRender = async function (
  this: ICompiler,
  content: string,
  originPath: string,
  stdinDir: string,
  options: Less.Options,
  _: Map<string, string>,
  implementation?: object | string,
) {
  const less = await loadProcessor('less', this.context.root, implementation);
  const result = {
    ...(await less.render(content, {
      relativeUrls: true,
      filename: originPath,
      ...options,
      paths: [
        ...(options?.paths || ['node_modules']),
        this.context.root,
        stdinDir,
      ],
      plugins: [
        new LessAliasesPlugin({
          compiler: this,
          stdinDir,
        }),
        ...(options?.plugins || []),
      ],
    })),
  };
  return result;
};
