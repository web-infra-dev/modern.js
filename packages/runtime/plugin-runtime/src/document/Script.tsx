// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import {
  DOCUMENT_SCRIPT_PLACEHOLDER_START,
  DOCUMENT_SCRIPT_PLACEHOLDER_END,
} from './constants';

export function Script(props: { content: () => void }) {
  const { content } = props;
  const contentStr = content.toString();
  const contentIIFE = encodeURIComponent(`(${contentStr})()`);
  return (
    <>
      {`${DOCUMENT_SCRIPT_PLACEHOLDER_START}`}
      {`${contentIIFE}`}
      {`${DOCUMENT_SCRIPT_PLACEHOLDER_END}`}
    </>
  );
}
