import { parseSync } from '@swc/core';

export interface StageDeclaration {
  stage: string;
  /** The `import()` request, e.g. `./Editor`. */
  request: string;
  /** 1-based line of the declaration, for messages. */
  line: number;
}

export interface ParseResult {
  declarations: StageDeclaration[];
  errors: string[];
}

type Node = { type?: string; span?: { start: number }; [key: string]: any };

const API_NAME = 'stagedImport';

const getLine = (source: string, offset: number) => {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) {
      line++;
    }
  }
  return line;
};

const getStaticString = (node: Node | undefined): string | undefined => {
  if (!node) {
    return undefined;
  }
  if (node.type === 'StringLiteral') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((quasi: Node) => quasi.cooked ?? quasi.raw).join('');
  }
  return undefined;
};

/** `() => import('x')`, `() => { return import('x') }` or `function () { return import('x') }`. */
const getImportRequest = (fn: Node | undefined): string | undefined => {
  if (
    !fn ||
    (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression')
  ) {
    return undefined;
  }
  let body: Node | undefined = fn.body;
  if (body?.type === 'BlockStatement' || body?.type === 'FunctionBody') {
    const statements = body.stmts as Node[];
    if (statements.length !== 1 || statements[0].type !== 'ReturnStatement') {
      return undefined;
    }
    body = statements[0].argument;
  }
  while (body?.type === 'ParenthesisExpression') {
    body = body.expression;
  }
  if (body?.type !== 'CallExpression' || body.callee?.type !== 'Import') {
    return undefined;
  }
  return getStaticString(body.arguments?.[0]?.expression);
};

/**
 * Find `stagedImport.<stage>(() => import('...'))` in a source file. The name
 * `stagedImport` and any local alias imported under that name are recognized,
 * as well as `<namespace>.stagedImport.<stage>(...)`.
 */
export const parseStageDeclarations = (
  source: string,
  filename: string,
  knownStages: Set<string>,
): ParseResult => {
  const result: ParseResult = { declarations: [], errors: [] };
  if (!source.includes(API_NAME)) {
    return result;
  }

  let program: Node;
  try {
    program = parseSync(source, {
      syntax: /\.tsx?$|\.[cm]ts$/.test(filename) ? 'typescript' : 'ecmascript',
      tsx: /\.tsx$/.test(filename),
      jsx: /\.jsx?$|\.mjs$|\.cjs$/.test(filename),
      decorators: true,
      target: 'esnext',
    }) as unknown as Node;
  } catch (error) {
    result.errors.push(
      `${filename}: failed to parse for resource stages: ${(error as Error).message}`,
    );
    return result;
  }
  const offset = program.span?.start ?? 0;

  const localNames = new Set([API_NAME]);
  for (const item of program.body as Node[]) {
    if (item.type !== 'ImportDeclaration') {
      continue;
    }
    for (const specifier of item.specifiers as Node[]) {
      if (
        specifier.type === 'ImportSpecifier' &&
        (specifier.imported?.value ?? specifier.local.value) === API_NAME
      ) {
        localNames.add(specifier.local.value);
      }
    }
  }

  const isApi = (node: Node | undefined) =>
    (node?.type === 'Identifier' && localNames.has(node.value)) ||
    (node?.type === 'MemberExpression' &&
      node.property?.type === 'Identifier' &&
      node.property.value === API_NAME);

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }
    const current = node as Node;
    if (
      current.type === 'CallExpression' &&
      current.callee?.type === 'MemberExpression' &&
      isApi(current.callee.object) &&
      current.callee.property?.type === 'Identifier'
    ) {
      const stage: string = current.callee.property.value;
      const line = getLine(source, (current.span?.start ?? offset) - offset);
      const request = getImportRequest(current.arguments?.[0]?.expression);
      if (!knownStages.has(stage)) {
        result.errors.push(
          `${filename}:${line}: unknown resource stage "${stage}". Declare it in performance.resourceStages.stages.`,
        );
      } else if (request === undefined) {
        result.errors.push(
          `${filename}:${line}: ${API_NAME}.${stage}() must receive a function that returns import('<static path>').`,
        );
      } else {
        result.declarations.push({ stage, request, line });
      }
    }
    for (const key of Object.keys(current)) {
      if (key !== 'span') {
        visit(current[key]);
      }
    }
  };
  visit(program.body);
  return result;
};
