import type { TransformOptions } from '@babel/core';

export type BabelPlainConfig = Omit<TransformOptions, 'plugins' | 'presets'>;

export type GetSetter<T extends Record<string, any>> = {
  [K in keyof T]: (input: T[K]) => void;
};

export type PlainSetter = {
  delete: (key: keyof BabelPlainConfig) => void;
} & GetSetter<Required<BabelPlainConfig>>;

export type BabelPlainChain = {
  plain: PlainSetter;
  toJSON: () => BabelPlainConfig;
  merge: (other: BabelPlainChain) => BabelPlainChain;
};

export const createBabelPlainChain = (): BabelPlainChain => {
  let config: BabelPlainConfig = {};

  const plain: any = {
    // delete operator
    delete: (key: keyof BabelPlainConfig) => {
      delete config[key];
    },
    // field setter
    cwd: (input: BabelPlainConfig['cwd']) => {
      config.cwd = input;
    },
    caller: (input: BabelPlainConfig['caller']) => {
      config.caller = input;
    },
    filename: (input: BabelPlainConfig['filename']) => {
      config.filename = input;
    },
    filenameRelative: (input: BabelPlainConfig['filenameRelative']) => {
      config.filenameRelative = input;
    },
    code: (input: BabelPlainConfig['code']) => {
      config.code = input;
    },
    ast: (input: BabelPlainConfig['ast']) => {
      config.ast = input;
    },
    root: (input: BabelPlainConfig['root']) => {
      config.root = input;
    },
    rootMode: (input: BabelPlainConfig['rootMode']) => {
      config.rootMode = input;
    },
    envName: (input: BabelPlainConfig['envName']) => {
      config.envName = input;
    },
    configFile: (input: BabelPlainConfig['configFile']) => {
      config.configFile = input;
    },
    babelrc: (input: BabelPlainConfig['babelrc']) => {
      config.babelrc = input;
    },
    babelrcRoots: (input: BabelPlainConfig['babelrcRoots']) => {
      config.babelrcRoots = input;
    },
    extends: (input: BabelPlainConfig['extends']) => {
      config.extends = input;
    },
    env: (input: BabelPlainConfig['env']) => {
      config.env = input;
    },
    overrides: (input: BabelPlainConfig['overrides']) => {
      config.overrides = input;
    },
    test: (input: BabelPlainConfig['test']) => {
      config.test = input;
    },
    include: (input: BabelPlainConfig['include']) => {
      config.include = input;
    },
    exclude: (input: BabelPlainConfig['exclude']) => {
      config.exclude = input;
    },
    ignore: (input: BabelPlainConfig['ignore']) => {
      config.ignore = input;
    },
    only: (input: BabelPlainConfig['only']) => {
      config.only = input;
    },
    inputSourceMap: (input: BabelPlainConfig['inputSourceMap']) => {
      config.inputSourceMap = input;
    },
    sourceMaps: (input: BabelPlainConfig['sourceMaps']) => {
      config.sourceMaps = input;
    },
    sourceFileName: (input: BabelPlainConfig['sourceFileName']) => {
      config.sourceFileName = input;
    },
    sourceRoot: (input: BabelPlainConfig['sourceRoot']) => {
      config.sourceRoot = input;
    },
    sourceType: (input: BabelPlainConfig['sourceType']) => {
      config.sourceType = input;
    },
    highlightCode: (input: BabelPlainConfig['highlightCode']) => {
      config.highlightCode = input;
    },
    wrapPluginVisitorMethod: (
      input: BabelPlainConfig['wrapPluginVisitorMethod'],
    ) => {
      config.wrapPluginVisitorMethod = input;
    },
    parserOpts: (input: BabelPlainConfig['parserOpts']) => {
      config.parserOpts = input;
    },
    generatorOpts: (input: BabelPlainConfig['generatorOpts']) => {
      config.generatorOpts = input;
    },
    retainLines: (input: BabelPlainConfig['retainLines']) => {
      config.retainLines = input;
    },
    compact: (input: BabelPlainConfig['compact']) => {
      config.compact = input;
    },
    minified: (input: BabelPlainConfig['minified']) => {
      config.minified = input;
    },
    auxiliaryCommentBefore: (
      input: BabelPlainConfig['auxiliaryCommentBefore'],
    ) => {
      config.auxiliaryCommentBefore = input;
    },
    auxiliaryCommentAfter: (
      input: BabelPlainConfig['auxiliaryCommentAfter'],
    ) => {
      config.auxiliaryCommentAfter = input;
    },
    comments: (input: BabelPlainConfig['comments']) => {
      config.comments = input;
    },
    shouldPrintComment: (input: BabelPlainConfig['shouldPrintComment']) => {
      config.shouldPrintComment = input;
    },
    moduleIds: (input: BabelPlainConfig['moduleIds']) => {
      config.moduleIds = input;
    },
    moduleId: (input: BabelPlainConfig['moduleId']) => {
      config.moduleId = input;
    },
    getModuleId: (input: BabelPlainConfig['getModuleId']) => {
      config.getModuleId = input;
    },
    moduleRoot: (input: BabelPlainConfig['moduleRoot']) => {
      config.moduleRoot = input;
    },
  };

  const toJSON = () => ({ ...config });

  // straightforward merging babel config
  // see https://babeljs.io/docs/en/configuration#how-babel-merges-config-items
  const merge = (other: BabelPlainChain): BabelPlainChain => {
    const otherConfig = other.toJSON();

    const nexConfig = {
      ...config,
      ...otherConfig,
    };

    if (nexConfig.parserOpts) {
      nexConfig.parserOpts = {
        ...config.parserOpts,
        ...otherConfig.parserOpts,
      };
    }

    if (nexConfig.generatorOpts) {
      nexConfig.generatorOpts = {
        ...config.generatorOpts,
        ...otherConfig.generatorOpts,
      };
    }

    config = nexConfig;

    return chain;
  };

  const chain: BabelPlainChain = {
    plain,
    toJSON,
    merge,
  };

  return chain;
};
