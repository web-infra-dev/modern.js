import React from 'react';
import ReactDomServer from 'react-dom/server';
import { Body, Head, Html, Root } from '../../src/document';

describe('debug Root component type', () => {
  it('should have correct type name', () => {
    const rootElement = <Root rootId="custom" />;
    expect((rootElement as any).type?.name).toBe('Root');
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

    const hasCustomId = docHtml.includes('id="custom"');
    const hasRootId = docHtml.includes('id="root"');

    expect(hasCustomId).toBe(true);
    expect(hasRootId).toBe(false);
  });

  it('should render document without Root', () => {
    const document = (
      <Html>
        <Head />
        <Body />
      </Html>
    );

    const docHtml = ReactDomServer.renderToString(document);

    const hasRootId = docHtml.includes('id="root"');

    expect(hasRootId).toBe(true);
  });
});
