import React, { useContext } from 'react';
import {
  Html,
  Root,
  Head,
  DocumentContext,
  Body,
  Style,
  Comment,
} from '@modern-js/runtime/document';

export default function Document(): React.ReactElement {
  // props: Record<string, unknown>,
  const {
    config: { output: htmlConfig },
    entryName,
    templateParams,
  } = useContext(DocumentContext);

  return (
    <Html {...{ fromUserDoc: true, lang: 'cn' }}>
      <Head>
        <Style>
          {`
            .logo-spin > div:last-child {
              margin-right: 0;
            }
          `}
        </Style>
        {/* comment should be render to html by Comment.children */}
        <Comment comment="!== COMMENT BY APP but inline ==">
          {'<!-- COMMENT BY APP -->'}
        </Comment>
        {/* comment should be render to html by Comment.comment */}
        <Comment comment="!== COMMENT BY APP in inline ==" />
        <link href="/ababad"></link>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.b = 22`,
          }}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `var a = function() {console.log('sss')}; a();`,
          }}
        ></script>
      </Head>
      <Body>
        <Root>
          <h1 style={{ color: 'red' }}>以下为构建时传过来的参数：</h1>
          <h2> entryName：{entryName}</h2>
          <h2> title：{htmlConfig.title}</h2>
          <h2> rootId: {templateParams.mountId}</h2>
          <h2> props: {JSON.stringify(htmlConfig)}</h2>
        </Root>
        <h1>bottom</h1>
      </Body>
    </Html>
  );
}
