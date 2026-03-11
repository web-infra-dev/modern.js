import React from 'react';
import ReactDomServer from 'react-dom/server';
import { Body, Head, Html, Root } from '../../src/document';

describe('debug Root component type', () => {
  it('should have correct type name', () => {
    const rootElement = <Root rootId="custom" />;

    console.log('=== Root Element Type Info ===');
    console.log('type:', (rootElement as any).type);
    console.log('type.name:', (rootElement as any).type?.name);
    console.log('typeof type:', typeof (rootElement as any).type);
  });

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

    console.log('=== HTML OUTPUT ===');
    console.log(docHtml);

    const hasCustomId = docHtml.includes('id="custom"');
    const hasRootId = docHtml.includes('id="root"');

    console.log('Has custom id:', hasCustomId);
    console.log('Has root id:', hasRootId);

    // If both are true, it means there are 2 Root divs (bug!)
    expect(hasCustomId && hasRootId).toBe(false);
  });
});
