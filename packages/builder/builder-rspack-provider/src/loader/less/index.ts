import path from 'path';
import { Buffer } from 'buffer';
import { getCompiledPath } from '../../shared';

const generateOptions = (options: Less.Options): Less.Options => {
  const defaultConfig = {
    enableSourcemap: false,
  };
  return {
    ...defaultConfig,
    ...options,
  };
};

export interface Options {
  implementation?: string;
  lessOptions?: Less.Options;
}

export default async function lessLoader(loaderContext: any) {
  const meta = '';
  const { lessOptions: options, implementation } =
    loaderContext.getOptions() ?? {};

  try {
    const code = loaderContext.source.getCode();
    const final_options = generateOptions({
      filename: loaderContext.resourcePath,
      ...options,
      paths: [
        ...(options?.paths || ['node_modules']),
        path.dirname(loaderContext.resourcePath),
      ],
      plugins: [],
    });

    let lessImplementation;

    if (typeof implementation === 'string') {
      lessImplementation = require(implementation);
    } else {
      lessImplementation = require(getCompiledPath('less'));
    }
    const result = await lessImplementation.render(code, final_options);
    const { css } = result;

    return {
      content: css,
      meta: meta ? Buffer.from(JSON.stringify(meta)) : '',
    };
  } catch (error) {
    console.error(loaderContext.resourcePath);
    console.error(error);
    throw error;
  }
}
