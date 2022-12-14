// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import {
  DOCUMENT_SCRIPT_PLACEHOLDER_START,
  DOCUMENT_SCRIPT_PLACEHOLDER_END,
} from './constants';

export function Script(props: { content: () => void }) {
  const { content } = props;
  const fnStr = content.toString();
  const fnIIFE = encodeURIComponent(`(${fnStr})()`);
  return (
    <>
      {`${DOCUMENT_SCRIPT_PLACEHOLDER_START}`}
      {`${fnIIFE}`}
      {`${DOCUMENT_SCRIPT_PLACEHOLDER_END}`}
    </>
  );
}
