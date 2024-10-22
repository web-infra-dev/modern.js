import React from 'react';
import {
  DOCUMENT_COMMENT_PLACEHOLDER_END,
  DOCUMENT_COMMENT_PLACEHOLDER_START,
} from './constants';

export function Comment(props: { comment?: string; children?: string }) {
  const { comment, children } = props;
  const commentStr = encodeURIComponent(children || comment || '');
  return (
    <>
      {`${DOCUMENT_COMMENT_PLACEHOLDER_START}`}
      {`${commentStr}`}
      {`${DOCUMENT_COMMENT_PLACEHOLDER_END}`}
    </>
  );
}
