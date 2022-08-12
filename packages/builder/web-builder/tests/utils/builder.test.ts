import { expect, it, describe } from 'vitest';
import { createStubBuilder } from './builder';

describe('tests/stub-builder', () => {
  it('should catch trace stacks when hooks unresolved', async () => {
    const builder = createStubBuilder();
    await builder.unwrapWebpackConfig();
    await expect(builder.unwrapWebpackConfig()).rejects.toMatchSnapshot();
  });
});
