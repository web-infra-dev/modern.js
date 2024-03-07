/**
 * @jest-environment node
 */
import { createElement } from 'react';
import { createRender } from '../../../../src/ssr/serverRender/renderToString/render';
import { createStyledCollector } from '../../../../src/ssr/serverRender/renderToString/styledComponent';
import App from '../../fixtures/string-ssr/App';

describe('test render', () => {
  it('should render styledComponent correctly', async () => {
    const result = {
      chunksMap: {
        js: '',
        css: '',
      },
      renderLevel: 2,
    };
    const Apps = createElement(App);

    const html = await createRender(Apps, result)
      .addCollector(createStyledCollector(result))
      .finish();

    expect(html).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });
});
