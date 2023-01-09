import { unified } from 'unified';
import { describe, test, expect } from 'vitest';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkPluginContainer } from '../src';

describe('remark-container', () => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkPluginContainer)
    .use(remarkRehype)
    .use(rehypeStringify);
  test('No newline', () => {
    const result = processor.processSync(`
  :::tip
  This is a tip
  :::

  12312
  `);
    expect(result.value).toMatchSnapshot();
  });

  test('With a new line after the start position of container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip
  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With new line before the end position of container', () => {
    const result = processor.processSync(`
  :::tip
  This is a tip

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With new line in all case', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With code block in container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip with \`code\` and [link](xxx) some text

  \`\`\`js
  const a = 1;
  \`\`\`

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With block quote in container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip with \`code\` and [link](xxx) some text

  > This is a quote

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With link, inlineCode, img, list in container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip with \`code\` and [link](xxx) some text

  - list 1
  - list 2

  ![img](xxx)

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Has space before type', () => {
    const result = processor.processSync(`
  ::: tip

  This is a tip.

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Use {title="xxx"} as title', () => {
    const result = processor.processSync(`
  ::: tip{title="Cutsom title"}

  This is a tip.

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test("Use {title='xxx'} as title", () => {
    const result = processor.processSync(`
::: tip{title='Cutsom title'}

This is a tip.

:::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Use {title=xxx} as title', () => {
    const result = processor.processSync(`
::: tip{title=Cutsom title}

This is a tip.

:::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Has space before :::', () => {
    const result = processor.processSync(`
::: tip title
sss
  :::`);
    expect(result.value).toMatchSnapshot();
  });
});
