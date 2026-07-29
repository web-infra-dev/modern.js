import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  UNRENDERED_COMPONENT,
  UNRESOLVED_IMPORT,
  stripCode,
} from '../doc-bundle-rules.mjs';

// Regression tests for the bundle gate's detection rules. Both checks used to
// have blind spots that let non-self-contained pages through: the import check
// only accepted single quotes, and the component check only knew a hardcoded
// list of names.

test('flags doc-site imports regardless of quote style', () => {
  const singleQuoted = "import Foo from '@site-docs-en/components/foo';";
  const doubleQuoted =
    'import EnableBFFCaution from "@site-docs-en/components/enable-bff-caution";';
  const themeDoubleQuoted = 'import { Badge } from "@theme";';

  assert.ok(UNRESOLVED_IMPORT.test(singleQuoted));
  assert.ok(UNRESOLVED_IMPORT.test(doubleQuoted));
  assert.ok(UNRESOLVED_IMPORT.test(themeDoubleQuoted));
});

test('ignores imports of published packages', () => {
  assert.ok(!UNRESOLVED_IMPORT.test("import { useState } from 'react';"));
  assert.ok(
    !UNRESOLVED_IMPORT.test('import { Something } from "@modern-js/runtime";'),
  );
});

test('flags any unrendered component, not just known names', () => {
  assert.ok(UNRENDERED_COMPONENT.test('<ReleaseNote />'));
  assert.ok(
    UNRENDERED_COMPONENT.test('<PackageManagerTabs command="install" />'),
  );
  // Would have been missed by a hardcoded list.
  assert.ok(UNRENDERED_COMPONENT.test('<EnableBFFCaution />'));
  assert.ok(UNRENDERED_COMPONENT.test('<Badge type="tip" text="v2" />'));
});

test('does not treat type signatures as components', () => {
  // `Promise<RsbuildConfig>` is prose in an API reference, not a component.
  assert.ok(!UNRENDERED_COMPONENT.test('Promise<RsbuildConfig> | void'));
  assert.ok(!UNRENDERED_COMPONENT.test('Array<string>'));
});

test('does not flag component usage shown as sample code', () => {
  const fenced = ['```tsx', '<ReleaseNote />', '```'].join('\n');
  assert.ok(!UNRENDERED_COMPONENT.test(stripCode(fenced)));

  const inline = 'Use `<ReleaseNote />` to embed the notes.';
  assert.ok(!UNRENDERED_COMPONENT.test(stripCode(inline)));
});

test('handles fences indented inside a list item', () => {
  // JSX in an indented sample block is code, not an unrendered component.
  const indented = [
    '- **Usage:**',
    '',
    '  ```tsx',
    '  api.wrapRoot(App => props => <App {...props} />);',
    '  ```',
  ].join('\n');
  assert.ok(!UNRENDERED_COMPONENT.test(stripCode(indented)));
});
