import { demos } from 'virtual-meta';
import { createElement } from 'react';
import { NoSSR, useLocation } from '@modern-js/doc-core/runtime';
import { normalizeId } from './utils';

export default function Demo() {
  // get the id from the pathname
  const { pathname } = useLocation();
  const id = pathname.split('/').pop();
  const normalizedId = normalizeId(id || '');
  // get component from virtual-meta
  const result = demos.flat().find(item => item.id === normalizedId);
  if (result) {
    return <NoSSR>{createElement(result.component)}</NoSSR>;
  } else {
    // TODO add some information
    return null;
  }
}
