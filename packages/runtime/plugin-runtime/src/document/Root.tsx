// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { omit } from '@modern-js/utils/lodash';
import { DocumentContext } from './DocumentContext';
import { DOCUMENT_SSR_PLACEHOLDER } from './constants';

export function Root(props: { children?: any; rootId?: string }) {
  const { rootId, children, ...rest } = props;
  const legalProperties = omit(rest, 'id');

  const {
    templateParams: { mountId = 'root' },
  } = useContext(DocumentContext);

  return (
    // in case for properities order not keep
    <div id={`${rootId || mountId}`} {...legalProperties}>
      {`${DOCUMENT_SSR_PLACEHOLDER}`}
      {children}
    </div>
  );
}

export function DefaultRoot(props: { children?: any }) {
  const {
    templateParams: { mountId = 'root' },
  } = useContext(DocumentContext);
  return (
    <div id={`${mountId}`}>
      {`${DOCUMENT_SSR_PLACEHOLDER}`}
      {props.children}
    </div>
  );
}
