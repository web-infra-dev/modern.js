/* eslint-disable max-lines */
import {
  getNormalizeModuleConfigByPackageModeAndFileds,
  getFinalTsconfig,
  getFinalDts,
  getSourceMap,
  normalizeBuildConfig,
} from '../../src/features/build/normalize';

describe('getNormalizeModuleConfigByPackageModeAndFileds', () => {
  const shortNameFn = getNormalizeModuleConfigByPackageModeAndFileds;
  const defaultOption = {
    platform: false,
    enableDtsGen: false,
    enableWatchMode: false,
    isTsProject: true,
    tsconfigName: './tsconfig.json',
    clear: true,
    styleOnly: false,
    outputPath: 'dist',
    legacyTsc: true,
  };
  let defaultConfig = {
    output: {
      importStyle: 'source-code',
    },
  } as any;
  const mockAPI = {
    useResolvedConfigContext() {
      return defaultConfig;
    },
  } as any;

  test('packageMode is universal-js', () => {
    defaultConfig.output.packageMode = 'universal-js';
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`packageMode is 'universal-js-lite' `, () => {
    defaultConfig.output.packageMode = 'universal-js-lite';
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`packageMode is 'browser-js' `, () => {
    defaultConfig.output.packageMode = 'browser-js';
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`packageMode is 'browser-js-lite' `, () => {
    defaultConfig.output.packageMode = 'browser-js-lite';
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`packageMode is 'node-js' `, () => {
    defaultConfig.output.packageMode = 'node-js';
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`packageFields is {}`, () => {
    // NB: this
    delete defaultConfig.output.packageMode;
    defaultConfig.output.packageFields = {};
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`packageFields is {module: "ESM+ES5", main: "CJS+ES6","jsnext:modern": "ESM+ES6"}`, () => {
    defaultConfig.output.packageFields = {
      module: 'ESM+ES5',
      main: 'CJS+ES6',
      'jsnext:modern': 'ESM+ES6',
    };
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });

  test(`importStyle is compiled-code`, () => {
    defaultConfig = {
      output: {
        importStyle: 'compiled-code',
      },
    };
    expect(shortNameFn(mockAPI, defaultOption)).toMatchSnapshot();
  });
});

describe('getFinalTsconfig', () => {
  test(`default. config is {}, cli option is { tsconfigName: './tsconfig.json'}`, () => {
    const ret = getFinalTsconfig({}, {
      tsconfigName: './tsconfig.json',
    } as any);
    expect(ret).toBe('./tsconfig.json');
  });

  test(`config is {tsconfig: './tsconfig.build.json'}, cli option is { tsconfigName: './tsconfig.json'}`, () => {
    const ret = getFinalTsconfig({ tsconfig: './tsconfig.build.json' }, {
      tsconfigName: './tsconfig.json',
    } as any);
    expect(ret).toBe('./tsconfig.build.json');
  });

  test(`config is {tsconfig: './tsconfig.build.json'}, cli is { tsconfigName: './tsconfig.dev.json'}`, () => {
    const ret = getFinalTsconfig({ tsconfig: './tsconfig.build.json' }, {
      tsconfigName: './tsconfig.dev.json',
    } as any);
    expect(ret).toBe('./tsconfig.dev.json');
  });
});

describe('getFinalDts', () => {
  test('js project should return false', () => {
    expect(
      getFinalDts({ enableDts: true }, { enableDtsGen: true } as any),
    ).toBe(false);
  });

  test('only cli option is {}', () => {
    expect(getFinalDts({}, { isTsProject: true } as any)).toBe(false);
    expect(getFinalDts({ enableDts: true }, { isTsProject: true } as any)).toBe(
      true,
    );
  });

  test('only cli option is {enableDtsGen: false}', () => {
    expect(
      getFinalDts({ enableDts: true }, {
        enableDtsGen: false,
        isTsProject: true,
      } as any),
    ).toBe(true);
    expect(
      getFinalDts({}, { enableDtsGen: false, isTsProject: true } as any),
    ).toBe(false);
  });

  test('only cli option is {enableDtsGen: true}', () => {
    expect(
      getFinalDts({}, { enableDtsGen: true, isTsProject: true } as any),
    ).toBe(true);
    expect(
      getFinalDts({ enableDts: true }, {
        enableDtsGen: true,
        isTsProject: true,
      } as any),
    ).toBe(true);
  });
});

describe('getSourceMap', () => {
  let modernConfig = {
    output: {},
  };
  const mockAPI = {
    useResolvedConfigContext: () => modernConfig,
  } as any;

  test('config.sourceMap is undefined, buildType is bundleless, output.disableSourceMap is undefined or false, return value decided by buildType', () => {
    expect(getSourceMap({}, 'bundleless', mockAPI)).toBe(false);
    expect(getSourceMap({}, 'bundle', mockAPI)).toBe(true);
  });

  test('when output.disableSourceMap is true, always return false.', () => {
    modernConfig = {
      output: { disableSourceMap: true },
    };
    expect(getSourceMap({}, 'bundleless', mockAPI)).toBe(false);
    expect(getSourceMap({}, 'bundle', mockAPI)).toBe(false);

    expect(getSourceMap({ sourceMap: true }, 'bundleless', mockAPI)).toBe(
      false,
    );
    expect(getSourceMap({ sourceMap: false }, 'bundleless', mockAPI)).toBe(
      false,
    );
    expect(getSourceMap({ sourceMap: 'external' }, 'bundleless', mockAPI)).toBe(
      false,
    );
    expect(getSourceMap({ sourceMap: 'inline' }, 'bundleless', mockAPI)).toBe(
      false,
    );
  });

  test('when config.sourceMap have value, will return it', () => {
    modernConfig = {
      output: {},
    };
    expect(getSourceMap({ sourceMap: 'external' }, 'bundleless', mockAPI)).toBe(
      'external',
    );
    expect(getSourceMap({ sourceMap: 'external' }, 'bundle', mockAPI)).toBe(
      'external',
    );

    expect(getSourceMap({ sourceMap: true }, 'bundle', mockAPI)).toBe(true);
    expect(getSourceMap({ sourceMap: true }, 'bundleless', mockAPI)).toBe(true);

    expect(getSourceMap({ sourceMap: false }, 'bundle', mockAPI)).toBe(false);
    expect(getSourceMap({ sourceMap: false }, 'bundleless', mockAPI)).toBe(
      false,
    );

    expect(getSourceMap({ sourceMap: 'inline' }, 'bundleless', mockAPI)).toBe(
      'inline',
    );
    expect(getSourceMap({ sourceMap: 'inline' }, 'bundle', mockAPI)).toBe(
      'inline',
    );
  });
});

describe('normalizeBuildConfig', () => {
  const defaultOption = {
    platform: false,
    enableDtsGen: false,
    enableWatchMode: false,
    isTsProject: true,
    tsconfigName: './tsconfig.json',
    clear: true,
    styleOnly: false,
    outputPath: 'dist',
    legacyTsc: true,
  };
  const defaultConfig = {
    output: {
      importStyle: 'source-code',
    },
  } as any;
  const mockAPI = {
    useResolvedConfigContext() {
      return defaultConfig;
    },
  } as any;
  test('build Config is {}', () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      {},
    );
    expect(ret).toMatchSnapshot();
  });
  test('build Config is [{}]', () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      [{}],
    );
    expect(ret).toMatchSnapshot();
  });
  test('build Config is [{}, {}]', () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      [{}, {}],
    );
    expect(ret).toMatchSnapshot();
  });

  test(`build Config is { format: 'some-value', target: some-value }`, () => {
    expect(
      normalizeBuildConfig(
        {
          buildFeatOption: defaultOption,
          api: mockAPI,
        },
        { target: 'es5', format: 'umd' },
      ),
    ).toMatchSnapshot();
    expect(
      normalizeBuildConfig(
        {
          buildFeatOption: defaultOption,
          api: mockAPI,
        },
        { target: 'es5', format: 'esm' },
      ),
    ).toMatchSnapshot();
    expect(
      normalizeBuildConfig(
        {
          buildFeatOption: defaultOption,
          api: mockAPI,
        },
        { target: 'es2020', format: 'esm' },
      ),
    ).toMatchSnapshot();
  });

  test(`build Config is {buildType: 'bundle'}`, () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      { buildType: 'bundle' },
    );
    expect(ret).toMatchSnapshot();
  });

  test(`build Config is {buildType: 'bundle'} in js project`, () => {
    defaultOption.isTsProject = false;
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      { buildType: 'bundle' },
    );
    expect(ret).toMatchSnapshot();
    defaultOption.isTsProject = true;
  });

  test(`build Config is
    {
      buildType: 'bundle',
      outputPath: './lib',
      bundlelessOptions: {
        sourceDir: 'lib',
      },
      bundleOptions:{
        entry: { 'app': 'src/index.ts' },
        platform: 'browser',
      }
    }`, () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      {
        buildType: 'bundle',
        outputPath: './lib',
        bundlelessOptions: {
          sourceDir: 'lib',
        },
        bundleOptions: {
          entry: { app: 'src/index.ts' },
          platform: 'browser',
          minify: 'esbuild',
        },
      },
    );
    expect(ret).toMatchSnapshot();
  });

  test(`build Config is
    {
      buildType: 'bundleless',
      outputPath: './esm',
      bundlelessOptions: {
        sourceDir: 'lib',
        style: {
          compileMode: '',
          path: './style',
        },
        static: { path: './static' },
      },
      bundleOptions:{
        entry: { 'app': 'src/index.ts' },
        platform: 'browser',
      }
    }`, () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      {
        buildType: 'bundleless',
        outputPath: './esm',
        bundlelessOptions: {
          sourceDir: 'lib',
          style: {
            compileMode: 'only-compiled-code',
            path: './style',
          },
          static: { path: './static' },
        },
        bundleOptions: {
          entry: { app: 'src/index.ts' },
          platform: 'browser',
        },
      },
    );
    expect(ret).toMatchSnapshot();
  });

  test(`buildFeatOption is
    {
      tsconfigName: './tsconfig.build.json',
      enableDtsGen: true,
      enableWatchMode: true,
      isTsProject: false,
      styleOnly: true,
      legacyTsc: false,
    }
  `, () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: {
          ...defaultOption,
          tsconfigName: './tsconfig.build.json',
          enableDtsGen: true,
          enableWatchMode: true,
          isTsProject: false,
          styleOnly: true,
          legacyTsc: false,
        },
        api: mockAPI,
      },
      {},
    );
    expect(ret).toMatchSnapshot();
  });

  test(`build config is
    {
      dtsOnly: true,
      enableDts: false,
      isTsProject: false,
    } in js project
  `, () => {
    const mockedWarn = jest.spyOn(console, 'warn');
    normalizeBuildConfig(
      {
        buildFeatOption: {
          ...defaultOption,
          isTsProject: true,
        },
        api: mockAPI,
      },
      {
        dtsOnly: true,
        enableDts: false,
      },
    );
    expect(mockedWarn).toBeCalledWith(
      '[WARN] dtsOnly 配置仅在 enableDts 为 true 的时候生效. 请检查当前的 dtsOnly、enableDts 是否配置正确',
    );

    normalizeBuildConfig(
      {
        buildFeatOption: {
          ...defaultOption,
          isTsProject: false,
        },
        api: mockAPI,
      },
      {
        dtsOnly: true,
        enableDts: true,
      },
    );
    expect(mockedWarn).toBeCalledWith(
      '[WARN] dtsOnly、enableDts 配置仅在 Ts 项目下生效',
    );
  });

  test('skipDeps', () => {
    const ret = normalizeBuildConfig(
      {
        buildFeatOption: defaultOption,
        api: mockAPI,
      },
      {
        buildType: 'bundle',
      },
      ['sass'],
    );
    expect(ret).toMatchSnapshot();
  });
});
/* eslint-enable max-lines */
