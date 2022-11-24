import { vi, expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { createBuilder } from '../helper';
import { PluginTarget } from '@/plugins/target';

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
      expected: { target: ['web', 'es2015'] },
    },
    {
      target: 'web',
      browserslist: null,
      expected: { target: ['web', 'es5'] },
    },
    {
      target: 'web-worker',
      browserslist: null,
      expected: { target: ['webworker', 'es5'] },
    },
  ];

  it.each(cases)('%j', async item => {
    const $getBrowserslist = vi
      .spyOn(shared, 'getBrowserslist')
      .mockResolvedValueOnce(item.browserslist);

    const builder = await createBuilder({
      plugins: [PluginTarget()],
      target: item.target as any,
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toEqual(item.expected);
    $getBrowserslist.mockRestore();
  });
});
