import React from 'react';
import ReactDomServer from 'react-dom/server';
import { Body, Head, Html, Root } from '../../src/document';

describe('debug Root component type', () => {
  it('should render document with Root', () => {
    const document = (
      <Html>
        <Head />
        <Body>
          <Root rootId="custom" />
        </Body>
      </Html>
    );

    const docHtml = ReactDomServer.renderToString(document);

    const hasCustomId = docHtml.includes('id="custom"');
    const hasRootId = docHtml.includes('id="root"');

    // If both are true, it means there are 2 Root divs (bug!)
    expect(hasCustomId && hasRootId).toBe(false);
  });
});
