import * as path from 'path';
import type {
  Configuration,
  RuleSetRule,
  WebpackPluginInstance,
} from 'webpack';
import { fs, logger } from '@modern-js/utils';
import webpack from 'webpack';
import { EDITOR_ENTRY, DEFAULT_ENTRY, MODE } from '../contants';
import createSyntheticEntry from './createSyntheticEntry';
import { buildUmd as build } from './umd-build';

const getEntryFile = (prefix: string) => {
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  for (const ext of extensions) {
    if (fs.existsSync(`${prefix}${ext}`)) {
      return `${prefix}${ext}`;
    }
  }
  return prefix;
};

export const handleWebpackConfig = (
  webpackConfig: Configuration,
  {
    umdEntryFile,
    appDirectory,
    isDev,
  }: {
    appDirectory: string;
    umdEntryFile: string;
    isDev: boolean;
  },
) => {
  webpackConfig.externals = [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-router',
    'react-router-dom',
    '@reduck/core',
    '@modern-js-reduck/react',
    '@modern-js-reduck/store',
    '@modern-js-block/runtime',
    '@modern-js-model/runtime',
    // 星夜区块单独发布的 reduck 版本
    '@modern-js-model/reduck-core',
    '@modern-js/runtime',
    '@modern-js/runtime-core',
    // 这个包在 nocode 调试时不应该被 external
    // '@modern-js/plugin-router',
    '@modern-js/plugin-state',
    '@modern-js/server-utils',
    'styled-components',
    'axios-retry',
    'axios',
    'moment',
    // TODO: type resolve
    ...((webpackConfig.externals as any) || []),
  ];

  // NB: umd是在编辑器里面用,相当于一直是 dev 模式
  webpackConfig.mode = 'development';
  webpackConfig.devtool = 'source-map';
  webpackConfig.optimization = {
    minimize: !isDev,
  };
  const definePlugins = (webpackConfig.plugins as WebpackPluginInstance[]).find(
    p => p.constructor.name === 'DefinePlugin',
  );
  if (definePlugins) {
    definePlugins.definitions['process.env.NODE_ENV'] =
      JSON.stringify('development');
  }
  const WrapperPlugin = require('../wrapper-webpack-plugin');
  webpackConfig.plugins = [
    ...(webpackConfig.plugins || []),
    new WrapperPlugin({
      test: /^index.js$/,
      header: '(module, exports, require) => {\n',
      footer: 'return module;}',
      afterOptimizations: true,
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ];
  if ((webpackConfig.entry as any).main) {
    webpackConfig.entry = {
      index: [
        ...(webpackConfig.entry as any).main.slice(
          0,
          (webpackConfig.entry as any).length - 1,
        ),
        umdEntryFile,
      ],
    };
  }
  webpackConfig.output = {
    ...webpackConfig.output,
    path: path.join(appDirectory, 'dist/umd'),
    filename: 'index.js',
    libraryTarget: 'umd',
  };
  webpackConfig.plugins = webpackConfig.plugins.filter(
    p => p.constructor.name !== 'HtmlWebpackPlugin',
  );
  (webpackConfig?.module?.rules as RuleSetRule[])?.[1]?.oneOf?.forEach(rule => {
    if (
      Array.isArray(rule.use) &&
      typeof rule.use[0] === 'object' &&
      (rule.use[0]?.loader || '').includes('mini-css-extract-plugin')
    ) {
      rule.use[0].loader = 'style-loader';
    }
  });
};

const compile = async (
  webpackConfig: Configuration,
  options: {
    appDirectory: string;
    umdEntryFile: string;
    editorEntryFile: string;
    isDev: boolean;
  },
) => {
  const { umdEntryFile, editorEntryFile, isDev } = options;
  logger.info('compile UMD entry', umdEntryFile);
  handleWebpackConfig(webpackConfig, options);
  await build(webpackConfig, { editorEntryFile, isDev });
};

const buildUmd = async (
  webpackConfig: any,
  {
    editorEntryFile,
    isDev,
    appDirectory,
    internalDirectory,
  }: {
    editorEntryFile: string;
    isDev: boolean;
    appDirectory: string;
    internalDirectory: string;
  },
) => {
  const hasEditor = true;
  const { meta } = require(path.resolve(appDirectory, 'package.json'));
  const isPlugin =
    meta && (meta.type === 'PLUGIN' || meta.blocks !== undefined);
  if (hasEditor) {
    const syntheticEntry = await createSyntheticEntry(
      appDirectory,
      internalDirectory,
      editorEntryFile,
    );
    await compile(webpackConfig, {
      appDirectory,
      umdEntryFile: syntheticEntry,
      editorEntryFile,
      isDev,
    });
  } else if (isPlugin) {
    await compile(webpackConfig, {
      appDirectory,
      umdEntryFile: getEntryFile(DEFAULT_ENTRY),
      isDev,
      editorEntryFile,
    });
  }
};

export default async (
  webpackConfig: any,
  {
    appDirectory,
    internalDirectory,
    isDev = false,
    type: _ = MODE.BLOCK,
  }: {
    appDirectory: string;
    internalDirectory: string;
    isDev?: boolean;
    type: string;
  },
) => {
  const userEditorEntryFile = getEntryFile(
    path.resolve(appDirectory, EDITOR_ENTRY),
  );
  const hasUserEntry = fs.existsSync(userEditorEntryFile);
  if (hasUserEntry) {
    await buildUmd(webpackConfig, {
      editorEntryFile: userEditorEntryFile,
      appDirectory,
      internalDirectory,
      isDev,
    });
  } else {
    const autoEditorEntryDir = path.join(internalDirectory, '__editor__');
    const autoEditorEntryFile = path.join(autoEditorEntryDir, 'index.js');
    fs.removeSync(autoEditorEntryDir);
    fs.ensureFileSync(autoEditorEntryFile);
    fs.writeFileSync(autoEditorEntryFile, ' ');
    await buildUmd(webpackConfig, {
      editorEntryFile: autoEditorEntryFile,
      appDirectory,
      internalDirectory,
      isDev,
    });
  }
};
