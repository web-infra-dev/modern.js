// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { DocumentContext } from './DocumentContext';
import { DOCUMENT_SSR_PLACEHOLDER } from './constants';

export function Root(props: { children?: any; rootId?: string }) {
  const { rootId, children } = props;
  const {
    templateParams: { mountId = 'root' },
  } = useContext(DocumentContext);

  return (
    <div id={`${rootId || mountId}`}>
      {`${DOCUMENT_SSR_PLACEHOLDER}`}
      {children}
    </div>
  );
}

export function DefaultRoot(props: { children?: any }) {
  const {
    templateParams: { mountId },
  } = useContext(DocumentContext);
  return (
    <div id={`${mountId}`}>
      {`${DOCUMENT_SSR_PLACEHOLDER}`}
      {props.children}
    </div>
  );
}
