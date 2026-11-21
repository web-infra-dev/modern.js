import { parseSync } from '@swc/core';

type Node = {
  type?: string;
  span?: { start: number; end: number };
  [key: string]: any;
};

export interface LoadableStagedImportOptions {
  /** Modules whose default or `lazy` export is loadable. */
  sources: string[];
}

const API_NAME = 'stagedImport';
const ANNOTATION = '/* #__LOADABLE__ */ ';

/**
 * Positions (UTF-8 byte offsets) of the `() => import()` functions that are
 * passed to `stagedImport.<stage>()` directly inside a loadable call:
 * `loadable(stagedImport.idle(() => import('./A')))`.
 */
export const findLoadableStagedImports = (
  source: string,
  filename: string,
  sources: string[],
) => {
  const program = parseSync(`;${source}`, {
    syntax: /\.tsx?$|\.[cm]ts$/.test(filename) ? 'typescript' : 'ecmascript',
    tsx: /\.tsx$/.test(filename),
    jsx: /\.jsx?$|\.mjs$|\.cjs$/.test(filename),
    decorators: true,
    target: 'esnext',
  }) as unknown as Node;
  // The leading `;` is a node at the first byte of the parsed text.
  const base = (program.body as Node[])[0].span!.start + 1;

  const loadableNames = new Set<string>();
  const apiNames = new Set([API_NAME]);
  for (const item of program.body as Node[]) {
    if (item.type !== 'ImportDeclaration') {
      continue;
    }
    const from: string = item.source.value;
    for (const specifier of item.specifiers as Node[]) {
      const imported =
        specifier.type === 'ImportDefaultSpecifier'
          ? 'default'
          : specifier.type === 'ImportSpecifier'
            ? (specifier.imported?.value ?? specifier.local.value)
            : undefined;
      if (
        sources.includes(from) &&
        (imported === 'default' || imported === 'lazy')
      ) {
        loadableNames.add(specifier.local.value);
      }
      if (imported === API_NAME) {
        apiNames.add(specifier.local.value);
      }
    }
  }
  if (!loadableNames.size) {
    return [];
  }

  const isApi = (node: Node | undefined) =>
    (node?.type === 'Identifier' && apiNames.has(node.value)) ||
    (node?.type === 'MemberExpression' &&
      node.property?.type === 'Identifier' &&
      node.property.value === API_NAME);

  const positions: number[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const current = node as Node;
    if (
      current.type === 'CallExpression' &&
      current.callee?.type === 'Identifier' &&
      loadableNames.has(current.callee.value)
    ) {
      const declaration = current.arguments?.[0]?.expression as
        Node | undefined;
      const fn = declaration?.arguments?.[0]?.expression as Node | undefined;
      if (
        declaration?.type === 'CallExpression' &&
        declaration.callee?.type === 'MemberExpression' &&
        isApi(declaration.callee.object) &&
        (fn?.type === 'ArrowFunctionExpression' ||
          fn?.type === 'FunctionExpression') &&
        fn.span
      ) {
        positions.push(fn.span.start - base);
      }
    }
    for (const key of Object.keys(current)) {
      if (key !== 'span') {
        visit(current[key]);
      }
    }
  };
  visit(program.body);
  return positions;
};

/**
 * Lets `loadable(stagedImport.<stage>(() => import('./A')))` render on the
 * server. The loadable SWC plugin only transforms `loadable(() => import())`,
 * or a function annotated with `#__LOADABLE__`; the annotation turns the
 * function into the loadable descriptor that `stagedImport` passes through.
 */
export default function loadableStagedImportLoader(
  this: {
    resourcePath: string;
    getOptions: () => LoadableStagedImportOptions;
  },
  source: string,
) {
  if (!source.includes(API_NAME)) {
    return source;
  }
  let positions: number[];
  try {
    positions = findLoadableStagedImports(
      source,
      this.resourcePath,
      this.getOptions().sources,
    );
  } catch {
    // The compiler reports syntax errors; leave the file as it is.
    return source;
  }
  if (!positions.length) {
    return source;
  }
  let bytes = Buffer.from(source);
  for (const position of positions.sort((a, b) => b - a)) {
    bytes = Buffer.concat([
      bytes.subarray(0, position),
      Buffer.from(ANNOTATION),
      bytes.subarray(position),
    ]);
  }
  return bytes.toString();
}
