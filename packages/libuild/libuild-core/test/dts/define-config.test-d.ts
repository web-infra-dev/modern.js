import { expectType, expectAssignable, expectNotAssignable } from 'tsd';

import { defineConfig, UserConfig } from '../../dist';

describe('Partial UserConfig', () => {
  const EMPTY_USER_CONFIG: {} = {};
  const PARTIAL_USER_CONFIG: Partial<UserConfig> = {};
  const PARTIAL_USER_CONFIG_LIST: Partial<UserConfig>[] = [];

  expectAssignable<UserConfig>(PARTIAL_USER_CONFIG);

  expectAssignable<UserConfig[]>(PARTIAL_USER_CONFIG_LIST);
  expectType<UserConfig>(defineConfig(EMPTY_USER_CONFIG));
  expectType<UserConfig[]>(defineConfig([]));
});

declare const VALID_USER_CONFIG_LIST: [
  {
    input: {
      aaa: 'aaa';
      bbb: 'bbb';
    };
  },
  {
    outdir: 'test';
    chunkNames: 'chunkNames';
  },
  {
    path: undefined;
    chunkNames: undefined;
  },
  {
    watch: true | false;
  },
  {
    logLevel: 'silent' | 'error' | 'warning' | 'info' | 'debug' | 'verbose';
  },
  {
    resolve: {
      alias: {
        '@/src': 'src';
      };
      mainFields: undefined | [] | ['source', 'module', 'main'];
      mainFiles: undefined | [] | ['index'];
      preferRelative: undefined | true | false;
    };
  },
  {
    plugins: [
      {
        name: 'plugin';
        apply: () => void;
      }
    ];
  },
  {
    target: 'es5' | 'es6';
  },
  {
    sourceMap: 'inline' | 'external' | true | false;
  },
  {
    external: [] | ['@modern-js/libuild'];
  },
  {
    platform: 'node' | 'browser';
  },
  {
    metafile: true | false;
  },
  {
    style: {
      less: {
        additionalData: '';
      };
      sass: {
        additionalData: '';
      };
      postcss: {
        processOptions: {};
        plugins: [];
      };
      cleanCss: true | false;
    };
  }
];

describe('Valid user configs', () => {
  expectAssignable<ReturnType<typeof defineConfig>>(VALID_USER_CONFIG_LIST);
});

declare const INVALID_USER_CONFIG_LIST: [
  {
    mode: 'aaa' | 'bbb';
  },
  {
    input: 'aaa';
  },
  {
    outdir: 123;
  },
  {
    resolve: false | true;
  },
  {
    profile: 'libuild';
  },
  {
    logLevel: 'aaa';
  },
  {
    minify: true;
  },
  {
    target: 'es2021';
  },
  {
    style: true;
  }
];

describe('Invalid user config', () => {
  expectNotAssignable<ReturnType<typeof defineConfig>>(INVALID_USER_CONFIG_LIST);
});
