import { describe } from 'vitest';
import { LoaderContext, LoaderDefinitionFunction } from 'webpack';
import { Output, createLoader } from '../src';

const mockSwcLoaderRunner = (): [
  Promise<ReturnType<LoaderDefinitionFunction>>,
  LoaderContext<{}>,
] => {
  let resolve;
  const p = new Promise<ReturnType<LoaderDefinitionFunction>>(
    r => (resolve = r),
  );
  return [
    p,
    {
      getOptions() {
        return {};
      },
      async() {
        return resolve;
      },
      resourcePath: '/test.js',
    } as LoaderContext<{}>,
  ];
};

function mockCompiler() {
  return class Compiler {
    config: any;
    constructor(config: any) {
      this.config = config;
    }

    async transform(
      filename: string,
      code: string,
      map?: string,
    ): Promise<Output> {
      return {
        code: 'mock',
        map: undefined,
      };
    }
  };
}

describe('should create loader correctly', async done => {
  const loader = createLoader(mockCompiler());

  const [finish, runner] = mockSwcLoaderRunner();

  loader.call(runner, '', {
    version: 3,
    file: 'app.js',
    sources: [],
    sourceRoot: '',
    names: [],
    mappings: '',
  });

  await finish;
  done();
});
