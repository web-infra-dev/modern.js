import os from 'os';
import assert from 'assert';
import ModuleParseError from 'webpack/lib/ModuleParseError';
import { useFixture } from '@modern-js/e2e';
import { expect, test } from 'vitest';
import {
  baseFormatter,
  prettyFormatter,
} from '@modern-js/friendly-errors-webpack-plugin/formatter';
import { parseError } from '@modern-js/friendly-errors-webpack-plugin/shared/utils';
import { transformModuleParseError } from '@modern-js/friendly-errors-webpack-plugin/transformer';
import stripAnsi from '@modern-js/utils/strip-ansi';
import { createStubBuilder } from '@/stub';

test.skipIf(os.platform() === 'win32')('MissingLoader', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic');
  const builder = await createStubBuilder({
    ...options,
    plugins: 'minimal',
  });
  const [{ stats }] = await builder.unwrapHook('onAfterBuildHook');
  assert(stats && 'compilation' in stats);
  const source = [
    'import { FC } from "react";',
    'export const Foo: FC = () => <div>foo</div>;',
  ].join('\n');
  const rawError = new Error('foo');
  const error = new ModuleParseError(
    source,
    rawError,
    ['bar-loader', 'foo-loader'],
    'javascript/esm',
  );
  const parsed = parseError(error);
  expect(baseFormatter(parsed)).toMatchInlineSnapshot(`
    "/moduleparseerror Module parse failed: foo
    File was processed with these loaders:
     * bar-loader
     * foo-loader
    You may need an additional loader to handle the result of these loaders.
    Error: foo
        at <ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>)
        at <ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>)"
  `);
  transformModuleParseError(parsed);
  expect(stripAnsi(prettyFormatter(parsed)!)).toMatchInlineSnapshot(`
    " ERROR  ModuleParseError: Module parse failed: foo
    File was processed with these loaders:
     * bar-loader
     * foo-loader
    You may need an additional loader to handle the result of these loaders. You can try to fix it by:
     * Check if the file is valid.
     * Enable relational config of \`tools\`: https:/modernjs.dev/builder/en/api/config-tools.html
     * Install builder plugins: https:/modernjs.dev/builder/en/plugin
    Or you can try to configure bundler loaders manually.
        at <ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>)
     CAUSE  Error: foo
        at <ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>)"
  `);
});
