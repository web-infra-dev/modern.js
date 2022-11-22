// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { ReactElement } from 'react';
import { Body } from './Body';
import { DocumentStructrueContext } from './DocumentStructrueContext';
import { Head } from './Head';

/**
 * get the directly son element
 */
function findTargetChild(tag: string, children: ReactElement[]) {
  return children.find(item => getEleType(item) === tag);
}

/**
 * get the type of react element
 */
function getEleType(ele: ReactElement) {
  // fixme: 非 react 的类型，有点儿问题。
  return typeof ele?.type === 'function' ? ele.type.name : ele?.type;
}

/**
 * get the children(grandChild included) with target type
 * @param tag the element type
 * @param children son element
 * @returns target element
 */
function findTargetElement(
  tag: string,
  children: ReactElement[],
): ReactElement | null {
  if (children.length === 0) {
    return null;
  }
  let nextChildren: ReactElement[] = [];
  for (const item of children) {
    if (tag === getEleType(item)) {
      return item;
    }
    if (item?.props?.children) {
      nextChildren = nextChildren.concat(item.props.children);
    }
  }
  return findTargetElement(tag, nextChildren);
}

export function Html(props: { children: any[] }) {
  const { children } = props;

  // deal with the component with default
  const hasSetHead = Boolean(findTargetChild('Head', children));
  const hasSetScripts = Boolean(findTargetElement('Scripts', children));
  const hasSetBody = Boolean(findTargetChild('Body', children));
  const hasSetRoot = Boolean(findTargetElement('Root', children));
  const notMissMustChild = [
    hasSetHead,
    hasSetBody,
    // hasSetScripts,
    // hasSetRoot,
  ].every(item => item);

  // todo: or throw an error
  if (!notMissMustChild) {
    return (
      <html>
        <body style={{ color: 'red' }}>
          {`Miss the `}
          {[
            hasSetHead,
            hasSetBody,
            // hasSetScripts,
            // hasSetRoot,
          ].map((item, index) => {
            return item
              ? null
              : [
                  'Head',
                  'Body',
                  // 'Scripts',
                  // 'Root',
                ][index];
          })}
          {` Element`}
        </body>
      </html>
    );
  }

  return (
    <html>
      <DocumentStructrueContext.Provider
        value={{
          hasSetHead,
          hasSetScripts,
          hasSetRoot,
          hasSetBody,
          docChild: children,
        }}
      >
        {!hasSetHead && <Head />}
        {!hasSetBody && <Body />}
        {children}
      </DocumentStructrueContext.Provider>
    </html>
  );
}
