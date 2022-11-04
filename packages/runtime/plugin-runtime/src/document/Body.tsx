import { useContext } from 'react';
import { DOCUMENT_NO_SCRIPTE_PLACEHOLDER } from './constants';
import { DocumentStructrueContext } from './DocumentStructrueContext';

export function Body(props: { children?: any; rootId?: string }) {
  const { hasSetRoot } = useContext(DocumentStructrueContext);
  const { rootId = 'root', children } = props;
  return (
    <body>
      <noscript>{DOCUMENT_NO_SCRIPTE_PLACEHOLDER}</noscript>
      {hasSetRoot ? null : <div id={rootId}></div>}
      {children}
    </body>
  );
}
