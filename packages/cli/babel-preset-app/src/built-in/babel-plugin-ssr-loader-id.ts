import crypto from 'crypto';
import { Buffer } from 'buffer';
import * as t from '@babel/types';
import { get } from '@modern-js/utils/lodash';

const RUNTIME_PACKAGE_NAMES = ['@modern-js/runtime'];
const FUNCTION_USE_LOADER_NAME = 'useLoader';

function getHash(filepath: string) {
  const cwd = process.cwd();
  const point = filepath.indexOf(cwd);
  let relativePath = filepath;

  if (point !== -1) {
    relativePath = filepath.substring(point + cwd.length);
  }

  const fileBuf = Buffer.from(relativePath);
  const fsHash = crypto.createHash('md5');
  const md5 = fsHash.update(fileBuf).digest('hex');
  return md5;
}

function getUseLoaderPath(path: any, calleeName: string | null) {
  const { node } = path;

  if (!calleeName || node.callee.name !== calleeName) {
    return false;
  }

  const arg1 = get(node, 'arguments.0');

  if (
    t.isFunction(arg1) ||
    t.isFunctionExpression(arg1) ||
    t.isArrowFunctionExpression(arg1) ||
    t.isIdentifier(arg1) ||
    t.isCallExpression(arg1)
  ) {
    const loaderPath = path.get('arguments.0');
    if (isDuplicateInnerLoader(loaderPath)) {
      return false;
    } else {
      return loaderPath;
    }
  }

  console.warn('useLoader 中 loaderId 生成失败，请检查 useLoader');
  throw path.buildCodeFrameError(`
    please check the usage of ${path.node.name}
  `);
}

// fix: react-refresh 和 export default App 格式的组件写法一起使用时， useLoader 调用会被调用两次，导致生成两个innerLoader
function isDuplicateInnerLoader(path: any) {
  const { node } = path;
  if (t.isFunctionExpression(node.callee)) {
    if (t.isBlockStatement(node.callee.body)) {
      if (
        get(node.callee.body, 'body.0.declarations.0.id.name') ===
          'innerLoader' &&
        get(node.callee.body, 'body.2.argument.name') === 'innerLoader'
      ) {
        return true;
      }
    }
  }
  return false;
}

function getSelfRunLoaderExpression(
  loaderExpression: t.Expression,
  id: string,
) {
  return t.callExpression(
    t.functionExpression(
      null,
      [],
      t.blockStatement([
        t.variableDeclaration('var', [
          t.variableDeclarator(t.identifier('innerLoader'), loaderExpression),
        ]),
        t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(t.identifier('innerLoader'), t.identifier('id')),
            t.stringLiteral(id),
          ),
        ),
        t.returnStatement(t.identifier('innerLoader')),
      ]),
    ),
    [],
  );
}

module.exports = function () {
  let useLoader: string | null = null;
  let hash = '';
  let index = 0;

  function genId() {
    return `${hash}_${index++}`;
  }

  return {
    name: 'babel-plugin-ssr-loader-id',
    pre() {
      index = 0;
      useLoader = null;
      hash = '';
    },
    visitor: {
      ImportDeclaration(path: any, state: any) {
        if (useLoader) {
          return false;
        }

        if (!RUNTIME_PACKAGE_NAMES.includes(get(path, 'node.source.value'))) {
          return false;
        }

        hash = getHash(state.file.opts.filename);

        get(path, 'node.specifiers', []).forEach(({ imported, local }: any) => {
          if (!imported) {
            throw path.buildCodeFrameError(
              `please \`import { useLoader } from ${RUNTIME_PACKAGE_NAMES[0]}\``,
            );
          }

          if (!useLoader && imported.name === FUNCTION_USE_LOADER_NAME) {
            useLoader = local.name;
          }
        });

        return false;
      },
      CallExpression(path: any) {
        let loaderPath = getUseLoaderPath(path, useLoader);
        if (loaderPath) {
          if (!Array.isArray(loaderPath)) {
            loaderPath = [loaderPath];
          }

          loaderPath.forEach((p: any) => {
            p.replaceWith(getSelfRunLoaderExpression(p.node, genId()));
          });

          return false;
        }

        return false;
      },
    },
  };
};
