import path from 'path';
import { fs } from '@modern-js/utils';
import {
  createReplaceChunkCss,
  createReplaceChunkJs,
  createReplaceHtml,
  createReplaceSSRDataScript,
  buildHtml,
} from '../../../../src/ssr/serverRender/renderToString/buildHtml';

describe('test renderToString buildTemplate', () => {
  it('should replace correctly', async () => {
    const filepath = path.resolve(
      __dirname,
      '../../fixtures',
      'htmlTemplate',
      'template.html',
    );
    const template = await fs.readFile(filepath, 'utf-8');
    const html = buildHtml(template, [
      createReplaceChunkCss('<link href="style.css">'),
      createReplaceChunkJs('<script src="main.js"></script>'),
      createReplaceHtml('<main><h1>Hello Modern.js</h1></main>'),
      createReplaceSSRDataScript(JSON.stringify({ name: 'xxx', age: 13 })),
    ]);
    expect(html).toMatchSnapshot();
  });
});
