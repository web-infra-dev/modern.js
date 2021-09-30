import React from 'react';
import { MDXProvider, mdx } from '@mdx-js/react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import styled from 'styled-components';
import DocsNav from './<%= relRoot %>/DocsNav';
import DocsToc from './<%= relRoot %>/DocsToc';
import Main from './mdx';
<%= imports %>

const CodeBlock = ({ children, className, live, render }) => {
  const language = className.replace(/language-/, '');
  if (live) {
    return (
      <div style={{ marginTop: '40px' }}>
        <LiveProvider
          code={children.trim()}
          transformCode={code => `/** @jsx mdx */${code}`}
          scope={{
            mdx,
            <%= imported %>
          }}>
          <LivePreview style={{
            boxShadow: '0 0 10px 5px gray',
            margin: '1rem 0',
            padding: '1rem',
          }}/>
          <LiveError />
          <LiveEditor style={{ backgroundColor: 'black', color: 'white' }} />
        </LiveProvider>
      </div>
    );
  }
  if (render) {
    return (
      <div style={{ marginTop: '40px' }}>
        <LiveProvider code={children.trim()}
          transformCode={code => `/** @jsx mdx */${code}`}
          scope={{
            mdx,
            <%= imported %>
          }}>
          <LivePreview style={{
            boxShadow: '0 0 10px 5px gray',
            margin: '1rem 0',
            padding: '1rem',
          }}/>
        </LiveProvider>
      </div>
    );
  }

  return (
    <Highlight {...defaultProps} code={children.trim()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: '20px' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

const components = {
  pre: props => <div {...props} />,
  code: CodeBlock,
  <%= imported %>
};

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
`;
const MainWrapper = styled.div`
  flex: 1;
  overflow-y: scroll;
  padding-right: 230px !important;
`;
const TocWrapper = styled.div`
  position: fixed;
  top: 2rem;
  right: 1.5rem;
`;

const Page = () => {
  return (
    <Wrapper>
      <MainWrapper className="markdown-body">
        <MDXProvider components={components}>
          <Main />
        </MDXProvider>
      </MainWrapper>
      <TocWrapper>
        <DocsToc entries={JSON.parse('<%= toc %>')}/>
      </TocWrapper>
    </Wrapper>
  );
};

export default Page;
