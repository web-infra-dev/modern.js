// biome-ignore lint/style/useImportType: <explanation>
import React, { type ReactElement } from 'react';
import { Body } from './Body';
import { DocumentStructureContext } from './DocumentStructureContext';
import { Head } from './Head';

/**
 * get the directly son element by name
 */
function findTargetChildByName(tag: string, children: ReactElement[]) {
  return children.find(item => getEleType(item) === tag);
}

/**
 * get the directly son element by component reference
 */
function findTargetChildByComponent(
  component: unknown,
  children: ReactElement[],
) {
  return children.find(item => item?.type === component);
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
  children: ReactElement<any>[],
): ReactElement<{ children?: ReactElement<any> }> | null {
  if (children.length === 0) {
    return null;
  }
  let nextChildren: ReactElement<{ children: ReactElement<any> }>[] = [];
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

export function Html(
  props: { children: any[] } & React.HtmlHTMLAttributes<HTMLHtmlElement>,
) {
  const { children, ...rest } = props;

  // deal with the component with default
  const hasSetHead = Boolean(
    findTargetChildByComponent(Head, children) ||
      findTargetChildByName('Head', children),
  );
  const hasSetScripts = Boolean(findTargetElement('Scripts', children));
  const hasSetLinks = Boolean(findTargetElement('Links', children));
  const hasSetBody = Boolean(
    findTargetChildByComponent(Body, children) ||
      findTargetChildByName('Body', children),
  );
  const hasSetRoot = Boolean(findTargetElement('Root', children));
  const hasSetTitle = Boolean(findTargetElement('title', children));
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
    <html {...rest}>
      <DocumentStructureContext.Provider
        value={{
          hasSetHead,
          hasSetScripts,
          hasSetLinks,
          hasSetRoot,
          hasSetBody,
          hasSetTitle,
          docChild: children,
        }}
      >
        {!hasSetHead && <Head />}
        {!hasSetBody && <Body />}
        {children}
      </DocumentStructureContext.Provider>
    </html>
  );
}
