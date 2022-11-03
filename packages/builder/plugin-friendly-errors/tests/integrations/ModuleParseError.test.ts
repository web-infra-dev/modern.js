import assert from 'assert';
import ModuleParseError from 'webpack/lib/ModuleParseError';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { useFixture } from '@modern-js/e2e';
import { test } from 'vitest';
import { baseFormatter, prettyFormatter } from '@/formatter';
import { parseError } from '@/shared/utils';
import { transformModuleParseError } from '@/transformer';

test('MissingLoader', async () => {
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
  console.log(baseFormatter(parsed));
  transformModuleParseError(parsed);
  console.log(prettyFormatter(parsed));
});
