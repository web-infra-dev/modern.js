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
            .global-entry-loading {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1;
            }
            .global-entry-loading .bytedance-logo-spin {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
            .bytedance-logo-spin {
              height: 60px;
              display: flex;
            }
            .bytedance-logo-spin > div {
              display: flex;
              flex-direction: column;
              height: 100%;
              margin-right: 8px;
            }
            .bytedance-logo-spin > div:last-child {
              margin-right: 0;
            }
            .bytedance-logo-spin > div > div,
            .bytedance-logo-spin > div > div > div {
              width: 10px;
              height: 30px;
            }
            .bytedance-logo-spin > div > div {
              overflow: hidden;
            }
            @keyframes movedown {
              0% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-20px);
              }
            }
            @keyframes moveup {
              0% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(20px);
              }
            }
            .bytedance-logo-spin > div > div:first-child > div {
              animation: moveup 0.6s linear infinite;
            }
            .bytedance-logo-spin > div > div:last-child > div {
              animation: movedown 0.6s linear infinite;
            }
            .bytedance-logo-spin > div:nth-child(1) > div > div {
              background-color: #335ab4;
            }
            .bytedance-logo-spin > div:nth-child(2) > div > div {
              background-color: #3c8cff;
              animation-delay: 0.15s;
            }
            .bytedance-logo-spin > div:nth-child(3) > div > div {
              background-color: #42c8d2;
              animation-delay: 0.3s;
            }
            .bytedance-logo-spin > div:nth-child(4) > div > div {
              background-color: #79e6dc;
              animation-delay: 0.45s;
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
