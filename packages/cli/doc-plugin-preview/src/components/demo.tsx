import { demos } from 'virtual-meta';
import { createElement } from 'react';
import { useLocation } from '@modern-js/doc-core/runtime';

export default function Demo() {
  // get the id from the pathname
  const { pathname } = useLocation();
  const id = pathname.split('/').pop();
  // get component from virtual-meta
  const result = demos.flat().find(item => item.id === id);
  if (result) {
    return createElement(result.component);
  } else {
    // TODO add 404 page
    return null;
  }
}
