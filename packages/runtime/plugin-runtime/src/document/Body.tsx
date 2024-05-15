import React, { useContext } from 'react';
import {
  BODY_PARTICALS_SEPARATOR,
  DOCUMENT_CHUNKSMAP_PLACEHOLDER,
  DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
} from './constants';
import { DocumentStructureContext } from './DocumentStructureContext';
import { DefaultRoot } from './Root';

export function Body(props: React.DOMAttributes<HTMLBodyElement>) {
  const { hasSetRoot } = useContext(DocumentStructureContext);
  const { children, ...rest } = props;
  return (
    <body {...rest}>
      {hasSetRoot ? null : <DefaultRoot />}
      {children}
      {`${BODY_PARTICALS_SEPARATOR}`}
      {`${DOCUMENT_CHUNKSMAP_PLACEHOLDER}`}
      {`${DOCUMENT_SSRDATASCRIPT_PLACEHOLDER}`}
    </body>
  );
}
