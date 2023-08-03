import { ILibuilder } from '../../types';
import { loadProcessor } from './utils';
import { PreprocessRender } from './transformStyle';
import LessAliasesPlugin from './lessAliasPlugin';

export const lessRender: PreprocessRender = async function (
  this: ILibuilder,
  content: string,
  originPath: string,
  stdinDir: string,
  options: Less.Options,
  _: Map<string, string>,
  implementation?: object | string
) {
  const less = await loadProcessor('less', this.config.root, implementation);
  const result = {
    ...(await less.render(content, {
      relativeUrls: true,
      filename: originPath,
      ...options,
      paths: [...(options?.paths || ['node_modules']), this.config.root, stdinDir],
      plugins: [
        new LessAliasesPlugin({
          config: this.config,
          stdinDir,
        }),
        ...(options?.plugins || []),
      ],
    })),
  };
  return result;
};
