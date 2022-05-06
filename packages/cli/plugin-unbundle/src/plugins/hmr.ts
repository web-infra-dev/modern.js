import path from 'path';
import { createDebugger } from '@modern-js/utils';
import { Plugin as RollupPlugin } from 'rollup';
import MagicString from 'magic-string';
import { Parser } from 'acorn';
import acornClassFields from 'acorn-class-fields';
import { CallExpression, MemberExpression, Identifier, Literal } from 'estree';
import { simple as esWalk } from 'acorn-walk';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { isJsRequest, isCSSRequest } from '../utils';
import { DEV_CLIENT_URL } from '../constants';
import { fileToModules } from '../AssetModule';

type AcceptDep = Literal & { start: number; end: number };

export type HMRAcceptDeps = {
  selfAccepted: boolean;
  acceptDeps: Array<AcceptDep>;
};

const debug = createDebugger('esm:hmr-plugin');

const hasHotContext = (code: string) =>
  code.includes('module.hot') || code.includes(`import.meta.hot`);

const shouldApplyHmr = (
  code: string,
  filename: string,
  internalDirectory: string,
) => {
  if (filename.startsWith(internalDirectory)) {
    return false;
  }

  if (isCSSRequest(filename)) {
    return true;
  }

  if (isJsRequest(filename) && hasHotContext(code)) {
    return true;
  }

  return false;
};

// append hmr api
export const hmrPlugin = (
  _config: NormalizedConfig,
  appContext: IAppContext,
): RollupPlugin => {
  const { appDirectory } = appContext;
  return {
    name: 'esm-hmr',
    async transform(code: string, importer: string) {
      const { internalDirectory } = appContext;
      if (!shouldApplyHmr(code, importer, internalDirectory)) {
        return null;
      }

      const s = new MagicString(code);

      const assetModule = fileToModules.get(importer);

      const { id } = assetModule!;

      s.prepend(
        `import { createHotContext} from "${DEV_CLIENT_URL}";\nimport.meta.hot = createHotContext(${JSON.stringify(
          id,
        )});\n`,
      );

      // replace webpack-style `module.hot` to `import.meta.hot`:
      if (code.includes('module.hot')) {
        const matches = code.matchAll(/module\.hot/g);
        for (const match of matches) {
          s.overwrite(
            match.index as number,
            (match.index as number) + 10,
            'import.meta.hot',
          );
        }
      }

      // auto wrapper import.hot.accept for css
      if (isCSSRequest(importer)) {
        s.append(
          [
            `\nimport.meta.hot.accept();`,
            `import.meta.hot.prune(() => {
                removeStyle(${JSON.stringify(importer)})
              });`,
          ].join('\n'),
        );

        assetModule!.selfAccepted = true;
        return { code: s.toString() };
      }

      if (s.toString().includes(`import.meta.hot.`)) {
        const finalStr = new MagicString(s.toString());

        const { selfAccepted, acceptDeps } = getHotAcceptDeps(s.toString());

        for (const { value, start, end } of acceptDeps) {
          const resolved = await this.resolve(
            value as string,
            path.dirname(importer),
          );
          // TODO: resolved 为 null时 错误提示
          if (resolved) {
            const filePath =
              typeof resolved === 'object' ? resolved.id : resolved;
            const relative = path.relative(appDirectory, filePath);

            const depId = relative.startsWith('.') ? filePath : `/${relative}`;

            assetModule!.acceptIds.add(depId);

            finalStr.overwrite(start, end, JSON.stringify(depId));
          }
        }

        assetModule!.selfAccepted = selfAccepted;

        debug(`file ${importer} selfAccepted & acceptDeps:`, {
          acceptDeps,
          selfAccepted,
        });

        return { code: finalStr.toString() };
      }

      return { code: s.toString() };
    },
  };
};

const isHotImportMetaNode = (node: MemberExpression) =>
  node.object &&
  node.object.type === 'MetaProperty' &&
  node.object.meta &&
  node.object.meta.name === 'import' &&
  node.object.property &&
  node.object.property.name === 'meta' &&
  node.property &&
  (node.property as Identifier).name === 'hot';

const getHotAcceptDeps = (code: string): HMRAcceptDeps => {
  let selfAccepted = false;
  const deps: Array<AcceptDep> = [];

  const ast = Parser.extend(acornClassFields).parse(code, {
    sourceType: 'module',
    ecmaVersion: '2020' as any,
  });

  esWalk(ast, {
    // @ts-expect-error
    CallExpression(node: CallExpression) {
      if (
        node.callee.type === 'MemberExpression' &&
        isHotImportMetaNode(node.callee.object as MemberExpression) &&
        node.callee.property &&
        (node.callee.property as Identifier).name === 'accept'
      ) {
        const args = node.arguments;

        if (
          args.length === 0 ||
          args[0].type === 'ArrowFunctionExpression' ||
          args[0].type === 'FunctionExpression'
        ) {
          selfAccepted = true;
        } else if (args[0].type === 'ArrayExpression') {
          for (const specifier of args[0].elements) {
            if ((specifier as Literal).type === 'Literal') {
              deps.push(specifier as AcceptDep);
            }
          }
        } else if (args[0].type === 'Literal') {
          deps.push(args[0] as AcceptDep);
        }
      }
    },
  });

  return {
    selfAccepted,
    acceptDeps: deps,
  };
};
