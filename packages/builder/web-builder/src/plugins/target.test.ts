import { vi, expect, describe, it } from 'vitest';
import * as shared from '../shared';
import { PluginTarget } from './target';
import { createStubBuilder } from '../../tests/utils/builder';

describe('plugins/target', () => {
  const cases = [
    {
      target: 'node',
      browserslist: ['foo'],
      expected: { target: 'node' },
    },
    {
      target: 'modern-web',
      browserslist: ['foo'],
      expected: { target: ['web', 'browserslist'] },
    },
    {
      target: 'modern-web',
      browserslist: null,
      expected: { target: ['web', 'es6'] },
    },
    {
      target: 'web',
      browserslist: null,
      expected: { target: ['web', 'es5'] },
    },
  ];

  it.each(cases)('%j', async item => {
    const $getBrowserslist = vi
      .spyOn(shared, 'getBrowserslist')
      .mockResolvedValueOnce(item.browserslist);

    const builder = createStubBuilder({
      plugins: [PluginTarget()],
      target: item.target as any,
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toEqual(item.expected);
    $getBrowserslist.mockRestore();
  });
});
