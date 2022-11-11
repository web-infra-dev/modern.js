import React, { useContext } from 'react';
import ReactDomServer from 'react-dom/server';

import {
  Html,
  Scripts,
  Body,
  Head,
  Root,
  DocumentContext,
} from '../../src/document';
import cliPlugin from '../../src/document/cli';

describe.only('plugin-document', () => {
  it('default', () => {
    expect(Html).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });

  it('should render correct document', () => {
    const document = (
      <Html>
        <Head></Head>
        <Body></Body>
      </Html>
    );
    const docHtml = ReactDomServer.renderToString(document);
    expect(docHtml).toEqual(
      `<html><head>%3C%25%3D%20meta%20%25%3E<!-- -->%3C!--%20chunk%20scripts%20placeholder%20--%3E</head><body><noscript>%3C!--%20no-script%20--%3E</noscript><div id="root"></div></body></html>`,
    );
  });

  it('should throw error when document not include some child', () => {
    const document = (
      <Html>
        <Head></Head>
        <div>abc</div>
      </Html>
    );
    const docHtml = ReactDomServer.renderToString(document);
    expect(docHtml.includes('Miss the Body Element')).toBeTruthy();
  });

  it('should give the correct child', () => {
    const H1D = () => {
      const data = useContext(DocumentContext);
      const { title } = data;
      return <h1>title: {title}</h1>;
    };
    const document = (
      <DocumentContext.Provider
        value={{
          templateParams: {
            title: 'aaaa',
          },
        }}
      >
        <Html>
          <Head></Head>
          <Body>
            <H1D />
            <Root rootId="abc"></Root>
            <Scripts></Scripts>
          </Body>
        </Html>
      </DocumentContext.Provider>
    );
    const docHtml = ReactDomServer.renderToString(document);
    expect(
      docHtml.includes(`<h1>title: </h1><div id="abc"></div>`),
    ).toBeTruthy();
  });
});
