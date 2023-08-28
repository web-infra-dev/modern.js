import { createElement } from 'react';
import { createRender } from '../../../../src/ssr/serverRender/renderToString/render';
import { createStyledCollector } from '../../../../src/ssr/serverRender/renderToString/styledComponent';
import App from '../../fixtures/string-ssr/App';

describe('test render', () => {
  it('should render styledComponent correctly', () => {
    const result = {
      chunksMap: {
        js: '',
        css: '',
      },
      renderLevel: 2,
    };
    const Apps = createElement(App);
    const html = createRender(Apps)
      .addCollector(createStyledCollector(result))
      .finish();

    expect(html).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });
});
