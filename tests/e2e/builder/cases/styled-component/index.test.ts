import path from 'path';
import { build } from '@scripts/shared';
import { expect, test } from '@modern-js/e2e/playwright';

const commonConfig = {
  cwd: __dirname,
  entry: { index: path.resolve(__dirname, './src/main.ts') },
  builderConfig: {
    tools: {
      bundlerChain: (chain: any) => {
        chain.externals(['styled-components']);
      },
    },
    output: {
      disableMinimize: true,
    },
  },
};

const noStyledConfig = {
  ...commonConfig,
  builderConfig: {
    ...commonConfig.builderConfig,
    tools: {
      ...commonConfig.builderConfig.tools,
      styledComponents: false as const,
    },
  },
};

test('should allow to disable styled-components', async () => {
  const builder = await build(noStyledConfig);
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];
  expect(content).toContain('div(');
});

test('should transform styled-components by default', async () => {
  const builder = await build(commonConfig);
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  expect(content).toContain('div.withConfig');
});
