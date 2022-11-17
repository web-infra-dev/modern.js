// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable react/no-danger */
import React, { useContext } from 'react';
import {
  Html,
  Root,
  Head,
  DocumentContext,
  Body,
} from '@modern-js/runtime/document';

export default function Document(): React.ReactElement {
  // props: Record<string, unknown>,
  const {
    config: { output: htmlConfig },
    entryName,
    templateParams,
  } = useContext(DocumentContext);

  return (
    <Html {...{ fromUserDoc: true }}>
      <Head>
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
