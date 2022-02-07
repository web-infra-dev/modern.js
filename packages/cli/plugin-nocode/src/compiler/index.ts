import * as path from 'path';
import type { Configuration, WebpackPluginInstance } from 'webpack';
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

const compile = async (
  webpackConfig: Configuration,
  {
    umdEntryFile,
    editorEntryFile,
    appDirectory,
    isDev,
  }: {
    appDirectory: string;
    umdEntryFile: string;
    editorEntryFile: string;
    isDev: boolean;
  },
) => {
  logger.info('compile UMD entry', umdEntryFile);
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
    '@modern-js/runtime',
    '@modern-js/runtime-core',
    '@modern-js/plugin-router',
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
