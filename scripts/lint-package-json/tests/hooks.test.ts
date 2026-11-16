import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from '@rstest/core';
import glob from 'fast-glob';
import ts from 'typescript';

it('routes a JSONC-only change to the actual staged dependency task', async () => {
  const filename = path.resolve(__dirname, '../../../rstack.config.mts');
  const code = await readFile(filename, 'utf8');
  const source = ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.Latest,
    true,
  );
  const patterns: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === 'define.staged' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const property of node.arguments[0].properties) {
        if (
          ts.isPropertyAssignment(property) &&
          ts.isStringLiteral(property.name) &&
          property.initializer
            .getText(source)
            .includes('pnpm lint:package-json --staged')
        ) {
          patterns.push(property.name.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const root = await mkdtemp(path.join(os.tmpdir(), 'dependency-hook-glob-'));
  try {
    await writeFile(path.join(root, 'base.jsonc'), '{}');
    expect(await glob(patterns, { cwd: root })).toContain('base.jsonc');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
