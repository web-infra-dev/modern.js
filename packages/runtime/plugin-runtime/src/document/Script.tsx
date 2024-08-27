import React from 'react';
import {
  DOCUMENT_SCRIPT_PLACEHOLDER_END,
  DOCUMENT_SCRIPT_PLACEHOLDER_START,
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
