import { describe, it } from 'vitest';
import { LoaderContext, LoaderDefinitionFunction } from 'webpack';
import { createLoader } from '../src/loader';

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

describe('should handle loader interface correctly', async done => {
  const loader = createLoader();

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
