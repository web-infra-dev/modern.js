import * as path from 'path';
import { createMatchPath } from '@modern-js/utils/tsconfig-paths';
import { fs } from '@modern-js/utils';
import * as parser from '../../compiled/@babel/parser';
import generator from '../../compiled/@babel/generator';
import * as t from '../../compiled/@babel/types';
import traverse, { NodePath } from '../../compiled/@babel/traverse';
import { defaultTransformedFunctions } from '../constants/dts';
import { dtsAliasExts } from '../constants/file';
import { matchesPattern, isImportCall } from './dts';

export interface TransformOption {
  filename: string;
  baseUrl: string;
  paths: Record<string, string[] | string>;
}

function mapPathString(
  nodePath: NodePath<t.StringLiteral>,
  { filename, baseUrl, paths }: TransformOption,
) {
  if (!t.isStringLiteral(nodePath)) {
    return;
  }

  const sourcePath = nodePath.node.value;
  const currentFile = filename;
  const matchPath = createMatchPath(
    baseUrl,
    paths as { [key: string]: Array<string> },
    ['index'],
  );
  const result = matchPath(
    sourcePath,
    packageJsonPath => {
      if (!fs.existsSync(packageJsonPath)) {
        return undefined;
      }
      return fs.readJSONSync(packageJsonPath);
    },
    filePath => fs.existsSync(filePath),
    dtsAliasExts,
  );
  if (result) {
    const relativePath = path.relative(
      path.dirname(currentFile),
      path.dirname(result),
    );
    const fileName = path.basename(result);
    // 如果是同级文件，则返回的是 ''
    const filePath = path.normalize(
      `${relativePath.length === 0 ? '.' : relativePath}/${fileName}`,
    );
    const replaceString = filePath.startsWith('.') ? filePath : `./${filePath}`;
    nodePath.replaceWith(t.stringLiteral(replaceString));
  }
}

const transformCall =
  (option: TransformOption) => (nodePath: NodePath<t.CallExpression>) => {
    const calleePath = nodePath.get('callee') as NodePath;
    const isNormalCall = defaultTransformedFunctions.some(pattern =>
      matchesPattern(calleePath, pattern),
    );
    if (isNormalCall || isImportCall(nodePath)) {
      mapPathString(
        nodePath.get('arguments.0') as NodePath<t.StringLiteral>,
        option,
      );
    }
  };

const transformImport =
  (option: TransformOption) => (nodePath: NodePath<t.ImportDeclaration>) => {
    mapPathString(nodePath.get('source'), option);
  };

const transformExport =
  (option: TransformOption) => (nodePath: NodePath<t.ExportDeclaration>) => {
    mapPathString(nodePath.get('source') as NodePath<t.StringLiteral>, option);
  };

const transformSingleFileAlias = ({
  filename,
  baseUrl,
  paths,
}: TransformOption) => {
  const sourceCode = fs.readFileSync(filename, 'utf-8');
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
    errorRecovery: true, // 防止typescript不支持的语法出现而报错
    plugins: ['typescript'],
  });
  traverse(ast, {
    CallExpression: transformCall({ filename, baseUrl, paths }) as any,
    ImportDeclaration: transformImport({
      filename,
      baseUrl,
      paths,
    }) as any,
    ExportDeclaration: transformExport({
      filename,
      baseUrl,
      paths,
    }) as any,
  });
  return generator(ast).code;
};

interface TransformDtsAliasOption {
  filenames?: string[];
  baseUrl: string;
  paths: Record<string, string[] | string>;
}
export const transformDtsAlias = (option: TransformDtsAliasOption) => {
  const { filenames = [], baseUrl, paths } = option;
  const transformResult: { path: string; content: string }[] = [];
  for (const filename of filenames) {
    transformResult.push({
      path: filename,
      content: transformSingleFileAlias({ filename, baseUrl, paths }),
    });
  }
  return transformResult;
};
