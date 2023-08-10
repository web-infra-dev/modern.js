import { demos } from 'virtual-meta';
import { createElement } from 'react';
import { NoSSR, useLocation } from '@modern-js/doc-core/runtime';
import Theme from '@modern-js/doc-core/theme';
import { normalizeId } from './utils';
import './virtual-demo.scss';

const { NotFoundLayout } = Theme;

export default function Demo(props: { iframePosition: string }) {
  // get the id from the pathname
  const { pathname } = useLocation();
  const id = pathname.split('/').pop();
  const normalizedId = normalizeId(id || '');
  // get component from virtual-meta
  if (props.iframePosition === 'fixed') {
    const renderDemos = demos
      .flat()
      .filter(item => new RegExp(`${normalizedId}_\\d+`).test(item.id));
    const componentList = renderDemos.map(demo => demo.component);
    return componentList.length > 0 ? (
      <NoSSR>
        <div className="preview-container">
          <div className="preview-nav">{renderDemos[0].title}</div>
          {componentList.map(component => {
            return <div>{createElement(component)}</div>;
          })}
        </div>
      </NoSSR>
    ) : (
      <NotFoundLayout />
    );
  } else {
    const component = demos
      .flat()
      .find(item => item.id === normalizedId)?.component;
    return component ? (
      <NoSSR>{createElement(component)}</NoSSR>
    ) : (
      <NotFoundLayout />
    );
  }
}
