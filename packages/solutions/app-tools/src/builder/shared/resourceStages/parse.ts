import { parseSync } from '@swc/core';

export interface StageDeclaration {
  stage: string;
  /** The `import()` request, e.g. `./Editor`. */
  request: string;
  /** 1-based line of the declaration, for messages. */
  line: number;
  /**
   * UTF-8 byte offset in the source right after the first argument, where the
   * build adds the declaration key of an element stage.
   */
  argumentEnd?: number;
}

export interface ParseResult {
  declarations: StageDeclaration[];
  /**
   * Declarations that are not prefetched, e.g. an unknown stage. They only
   * lose the prefetch: the `import()` still loads when the code calls it.
   */
  warnings: string[];
}

type Node = {
  type?: string;
  span?: { start: number; end: number };
  [key: string]: any;
};

const API_NAME = 'stagedImport';

/**
 * Line of a byte offset. SWC spans are UTF-8 byte offsets into a source map
 * shared by every parse in the process, so callers pass offsets relative to
 * the start of this file.
 */
const getLine = (bytes: Buffer, offset: number) => {
  let line = 1;
  for (let i = 0; i < offset && i < bytes.length; i++) {
    if (bytes[i] === 10) {
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

const PROMISE_METHODS = new Set(['then', 'catch', 'finally']);

/** Unwrap parentheses, TS assertions and `await`. */
const unwrap = (node: Node | undefined): Node | undefined => {
  let current = node;
  while (
    current &&
    (current.type === 'ParenthesisExpression' ||
      current.type === 'TsAsExpression' ||
      current.type === 'TsSatisfiesExpression' ||
      current.type === 'TsNonNullExpression' ||
      current.type === 'TsTypeAssertion' ||
      current.type === 'TsConstAssertion' ||
      current.type === 'AwaitExpression')
  ) {
    current =
      current.type === 'AwaitExpression'
        ? current.argument
        : current.expression;
  }
  return current;
};

/**
 * The request of `import('x')`, also through `.then()`, `.catch()` and
 * `.finally()`, e.g. `import('./A').then(m => ({ default: m.A }))`.
 */
const getImportCallRequest = (node: Node | undefined): string | undefined => {
  let current = unwrap(node);
  while (
    current?.type === 'CallExpression' &&
    current.callee?.type === 'MemberExpression' &&
    current.callee.property?.type === 'Identifier' &&
    PROMISE_METHODS.has(current.callee.property.value)
  ) {
    current = unwrap(current.callee.object);
  }
  if (current?.type !== 'CallExpression' || current.callee?.type !== 'Import') {
    return undefined;
  }
  return getStaticString(current.arguments?.[0]?.expression);
};

/**
 * `() => import('x')`, `async () => { return await import('x') }`,
 * `function () { return import('x') }`, each optionally followed by
 * `.then()` on the import.
 */
const getImportRequest = (fn: Node | undefined): string | undefined => {
  const target = unwrap(fn);
  if (
    !target ||
    (target.type !== 'ArrowFunctionExpression' &&
      target.type !== 'FunctionExpression')
  ) {
    return undefined;
  }
  let body: Node | undefined = target.body;
  if (body?.type === 'BlockStatement' || body?.type === 'FunctionBody') {
    const statements = body.stmts as Node[];
    if (statements.length !== 1 || statements[0].type !== 'ReturnStatement') {
      return undefined;
    }
    body = statements[0].argument;
  }
  return getImportCallRequest(body);
};

const getStageName = (property: Node | undefined): string | undefined => {
  if (property?.type === 'Identifier') {
    return property.value;
  }
  if (property?.type === 'Computed') {
    return getStaticString(property.expression);
  }
  return undefined;
};

/**
 * Parse a source file. Every span is shifted by where this file starts in the
 * shared source map; a leading `;` gives a node at the first byte, whatever
 * comments or blank lines the file starts with.
 */
export const parseSource = (source: string, filename: string) => {
  const program = parseSync(`;${source}`, {
    syntax: /\.tsx?$|\.[cm]ts$/.test(filename) ? 'typescript' : 'ecmascript',
    tsx: /\.tsx$/.test(filename),
    jsx: /\.jsx?$|\.mjs$|\.cjs$/.test(filename),
    decorators: true,
    target: 'esnext',
  }) as unknown as Node;
  const base = (program.body as Node[])[0]?.span?.start ?? program.span!.start;
  return {
    program,
    /** Byte offset in `source` of a span position. */
    offsetOf: (position: number) => position - base - 1,
  };
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
  const result: ParseResult = { declarations: [], warnings: [] };
  if (!source.includes(API_NAME)) {
    return result;
  }

  let parsed: ReturnType<typeof parseSource>;
  try {
    parsed = parseSource(source, filename);
  } catch (error) {
    result.warnings.push(
      `${filename}: failed to parse for resource stages, its declarations are not prefetched: ${(error as Error).message}`,
    );
    return result;
  }
  const { program, offsetOf } = parsed;
  const bytes = Buffer.from(source);

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
    const stage =
      current.type === 'CallExpression' &&
      current.callee?.type === 'MemberExpression' &&
      isApi(current.callee.object)
        ? getStageName(current.callee.property)
        : undefined;
    if (stage !== undefined) {
      const line = getLine(bytes, offsetOf(current.span?.start ?? 0));
      const firstArgument: Node | undefined =
        current.arguments?.[0]?.expression;
      const request = getImportRequest(firstArgument);
      if (!knownStages.has(stage)) {
        result.warnings.push(
          `${filename}:${line}: unknown resource stage "${stage}", so it is not prefetched. Declare it in performance.resourceStages.stages.`,
        );
      } else if (request === undefined) {
        result.warnings.push(
          `${filename}:${line}: ${API_NAME}.${stage}() is not prefetched: it must receive a function that returns import('<static path>').`,
        );
      } else {
        result.declarations.push({
          stage,
          request,
          line,
          ...(firstArgument?.span && current.arguments.length === 1
            ? { argumentEnd: offsetOf(firstArgument.span.end) }
            : {}),
        });
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
