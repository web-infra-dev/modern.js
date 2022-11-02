import { inspect } from '../../src/commands/inspect';

describe('inspect command', () => {
  const api = {
    useResolvedConfigContext() {
      return {
        source: {
          configDir: '/config',
        },
        output: {
          path: '/',
          jsPath: '/js',
          cssPath: '/css',
        },
        tools: {},
      };
    },
    useAppContext() {
      const dirname = '/User/example';
      return {
        metaName: '',
        appDirectory: dirname,
        distDirectory: `${dirname}/dist`,
        srcDirectory: `${dirname}/src`,
        sharedDirectory: `${dirname}/src/shared`,
        internalSrcAlias: '@_modern_js_src',
        internalDirAlias: '@_modern_js_internal',
        internalDirectory: `${dirname}/node_modules/.modern-js`,
        entrypoints: [
          {
            entryName: 'main',
            entry: ['./src/index.ts'],
          },
        ],
        htmlTemplates: {},
      };
    },
  };
  const options = {
    env: 'development',
    output: `${__dirname}/dist`,
  };

  test('should format webpack config correctly', async () => {
    const { builderConfig } = await inspect(api as any, options);
    expect(builderConfig).toMatchSnapshot();
  });
});
