/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-proto */
/* eslint-disable func-name-matching */
/* eslint-disable no-eval */
import path from 'path';
import fs from 'fs';
import Module from 'module';
import { JSDOM } from 'jsdom';

const externals = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-router',
  'react-router-dom',
  '@reduck/core',
  '@jupiter-block/runtime',
  '@jupiter/model-runtime',
  '@jupiter/source-runtime-tools',
  '@jupiter-app/runtime',
  '@jupiter-app/plugin-router',
  '@jupiter-app/plugin-immer',
  '@jupiter-app/plugin-state',
  'styled-components',
  'axios-retry',
  'axios',
  'moment',
];

const mockBrowserContext = (context, logger) => {
  const dom = new JSDOM(
    `<!DOCTYPE html><body><div id="root">Dom Proxy</div></body>`,
  );
  // context.global = null;
  context.document = dom.window.document;
  context.navigator = dom.window.navigator;
  context.Element = dom.window.Element;
  const __throwBlockError__ = err => {
    logger.error(
      `区块前置检测运行出现错误: ${err.message}. 请检查区块内部是否存在语法错误，或者设置 source.enableBlockPreValidate = false 跳过检测`,
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  };

  const createStorage = () => {
    let data = {
      get length() {
        return Object.keys(data).length - 1;
      },
    };
    const setItem = (key, value) => (data[key] = value);
    const getItem = key => data[key];
    const removeItem = key => delete data[key];
    const clear = () =>
      (data = {
        get length() {
          return Object.keys(data).length - 1;
        },
      });
    const key = k => k;

    return {
      setItem,
      getItem,
      removeItem,
      key,
      length: data.length,
      clear,
    };
  };

  const filterNames = [
    'sessionStorage',
    'localStorage',
    'window',
    'document',
    'setTimeout',
    'setInterval',
  ];

  Object.keys(dom.window).forEach(name => {
    if (!name.startsWith('_') && !filterNames.includes(name)) {
      context[name] = dom.window[name];
    }
  });

  context.localStorage = createStorage();
  context.sessionStorage = createStorage();
  context.window = {
    localStorage: context.localStorage,
    sessionStorage: context.sessionStorage,
    document: dom.window.document,
    setTimeout: dom.window.setTimeout,
    setInterval: dom.window.setInterval,
  };
  context.window.__proto__ = dom.window;
  // 源代码中可能有 instanceof HTMLDivElement 这样的代码
  // 需要把 window 上的所有属性都挂到 context 上
  context.__proto__ = dom.window;

  const original = (Module as any)._load;
  (Module as any)._load = function load(request, parent, isMain) {
    if (externals.includes(request)) {
      try {
        return original(request, parent, isMain);
      } catch (e) {
        return {};
      }
    }

    return original(request, parent, isMain);
  };

  const { Context } = require('@jupiter-block/runtime');
  Context.setContext({
    ErrorBoundary: ({ error }) => {
      __throwBlockError__(error);
      return 'error';
    },
  });

  return context;
};

const run = (block, logger) => {
  try {
    const React = require('react');
    const ReactDOM = require('react-dom');

    logger.log(`区块 ${block.name} 前置检测`);

    ReactDOM.render(
      React.createElement(block, null),
      window.document.querySelector('#root'),
    );
  } catch (err) {
    logger.error(
      `区块 ${block.name} 前置检测出错误: ${err.message}. 请检查区块内部是否存在语法错误，或者设置 source.enableBlockPreValidate = false 跳过检测`,
    );
  }
};

const preValidate = (appDirectory, name, version, meta, logger) => {
  const isGroup = Boolean(meta?.contains);
  const umd = path.join(appDirectory, 'dist/umd/index.js');
  const hasUmd = fs.existsSync(umd);
  if (hasUmd) {
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    mockBrowserContext(globalThis, logger);
    try {
      const text = fs.readFileSync(umd, 'utf-8');
      const fn = eval(text);
      const newModule = { exports: {} };
      fn(newModule, newModule.exports, require);
      if (isGroup) {
        Object.keys(meta.contains).forEach(blockName => {
          // 区块库中每一个区块
          const block = newModule.exports[blockName];
          block.name = blockName;
          if (!block) {
            throw new Error(
              `区块 ${blockName} 没有在区块库中被导出，请检查 meta.contains 声明或者导出 ${blockName} 区块`,
            );
          } else {
            run(block, logger);
          }
        });
      } else {
        // 不是区块库，是一个普通区块
        const block = (newModule.exports as any).default;
        block.name = 'default';
        if (!block) {
          throw new Error(
            `没有在目标文件中检测到 default export，请确保有正确的区块导出`,
          );
        } else {
          run(block, logger);
        }
      }
    } catch (e) {
      logger.error(`区块 NoCode 产物前置检测发现错误: ${e.message}`);
    }
  }
};

export default preValidate;
