import React, { useContext } from 'react';
import {
  Html,
  Root,
  Head,
  Body,
  Comment,
  DocumentContext,
} from '@modern-js/runtime/document';

export default function Document(): React.ReactElement {
  // DocumentContext 提供一些构建时的参数
  const {
    config: { output: htmlConfig },
    entryName,
    templateParams,
  } = useContext(DocumentContext);

  return (
    <Html>
      <Head>
        <link href="https://edenx.bytedance.net" />
        <Comment>{'<!-- Need a Comment -->'}</Comment>
      </Head>
      <Body>
        <Root rootId="root">
          <h1 style={{ color: 'red' }}>以下为构建时传过来的参数：</h1>
          <h2>entryName: {entryName}</h2>
          <h2>title: {htmlConfig.title}</h2>
          <h2>rootId: {templateParams.mountId}</h2>
        </Root>
        <h1>bottom</h1>
      </Body>
    </Html>
  );
}
