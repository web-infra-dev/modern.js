// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import {
  DOCUMENT_STYLE_PLACEHOLDER_END,
  DOCUMENT_STYLE_PLACEHOLDER_START,
} from './constants';

export function Style(
  props: {
    children?: string;
    content?: string;
  } & React.DOMAttributes<HTMLStyleElement>,
) {
  const { content, children } = props;
  const contentStr = children || content;
  const styleContent = encodeURIComponent(`${contentStr}`);
  return (
    <>
      {`${DOCUMENT_STYLE_PLACEHOLDER_START}`}
      {`${styleContent}`}
      {`${DOCUMENT_STYLE_PLACEHOLDER_END}`}
    </>
  );
}
