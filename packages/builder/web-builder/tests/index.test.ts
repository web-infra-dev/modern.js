import { createBuilder } from '../src';

test('local test', async () => {
  const builder = await createBuilder();
  const compiler = await builder.createCompiler();

  // eslint-disable-next-line no-console
  console.log(compiler);
});
