import React, { useContext } from 'react';
import ReactDomServer from 'react-dom/server';

import {
  Body,
  DocumentContext,
  Head,
  Html,
  Root,
  Script,
  Scripts,
} from '../../src/document';
import cliPlugin from '../../src/document/cli';

describe('plugin-document', () => {
  it('default', () => {
    expect(Html).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });

  it('should render correct document', () => {
    const document = (
      <Html>
        <Head />
        <Body />
      </Html>
    );
    const docHtml = ReactDomServer.renderToString(document);
    expect(docHtml).toEqual(
      `<html><head><title>%3C%25%3D%20title%20%25%3E</title>%3C!--%3C%3F-%20partials.top%20%3F%3E--%3E<!-- -->%3C%25%3D%20meta%20%25%3E%3C!--%20chunk%20links%20placeholder%20--%3E<!-- -->%3C!--%20chunk%20scripts%20placeholder%20--%3E<!-- -->%3C!--%3C%3F-%20partials.head%20%3F%3E--%3E</head><body><div id=\"root\">%3C!--%3C%3F-%20html%20%3F%3E--%3E</div>%3C!--%3C%3F-%20partials.body%20%3F%3E--%3E<!-- -->%3C!--%3C%3F-%20chunksMap.js%20%3F%3E--%3E<!-- -->%3C!--%3C%3F-%20SSRDataScript%20%3F%3E--%3E</body></html>`,
    );
  });

  it('should throw error when document not include some child', () => {
    const document = (
      <Html>
        <Head />
        <div>abc</div>
      </Html>
    );
    const docHtml = ReactDomServer.renderToString(document);
    expect(docHtml.includes('Miss the ')).toBeTruthy();
    expect(docHtml.includes('Body')).toBeTruthy();
    expect(docHtml.includes(' Element')).toBeTruthy();
  });

  it('should runder the script by IIFE ', () => {
    const fn = () => {
      console.log('===> script can use script');
    };
    const document = (
      <Html>
        <Head />
        <Body />
        <Script content={fn} />
      </Html>
    );
    const docHtml = ReactDomServer.renderToString(document);
    const fnStr = fn.toString();
    const expectFnStr = encodeURIComponent(`(${fnStr})()`);
    expect(
      // react will change ' => '&#x27;'
      docHtml.includes(expectFnStr.replaceAll("'", '&#x27;')),
    ).toBeTruthy();
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
          <Head />
          <Body>
            <H1D />
            <Root rootId="abc" />
            <Scripts />
          </Body>
        </Html>
      </DocumentContext.Provider>
    );
    const docHtml = ReactDomServer.renderToString(document);

    expect(docHtml.includes(`<h1>title: </h1><div id="abc">`)).toBeTruthy();
  });

  it('should render title successful', () => {
    const document = (
      <DocumentContext.Provider
        value={{
          templateParams: {
            title: 'aaaa',
          },
        }}
      >
        <Html>
          <Head />
          <Body>
            <Root rootId="abc" />
            <Scripts />
          </Body>
        </Html>
      </DocumentContext.Provider>
    );
    const docHtml = ReactDomServer.renderToString(document);

    expect(
      docHtml.includes(`<title>%3C%25%3D%20title%20%25%3E</title>`),
    ).toBeTruthy();
  });
});
