import { DocumentContext } from '@modern-js/runtime/document';
import { useContext } from 'react';

export default function Demo() {
  const data = useContext(DocumentContext);
  return (
    <>
      <div>Just for context{JSON.stringify(data.processEnv)}</div>
    </>
  );
}
