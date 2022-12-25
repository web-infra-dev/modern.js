// eslint-disable-next-line node/prefer-global/console
import { Console } from 'console';
import { expect, vi } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

global.console.Console = Console;

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [
      {
        mark: 'fragment',
        match: /(?<=\/)modern-js\/stub-builder\/[^/]+\/[^/]+/,
      },
    ],
  }),
);

vi.mock('@modern-js/builder-shared/test-stub', async () => {
  const { plugins } = await import('../../builder/src/plugins');
  return {
    mockBuilderPlugins: plugins,
  };
});
