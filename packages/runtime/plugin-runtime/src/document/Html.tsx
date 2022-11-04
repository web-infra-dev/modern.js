import { ReactElement } from 'react';
import { Body } from './Body';
import { DocumentStructrueContext } from './DocumentStructrueContext';
import { Head } from './Head';

/**
 * 获取直接子元素下指定元素
 */
function findTargetChild(tag: string, children: ReactElement[]) {
  return children.find(item => getEleType(item) === tag);
}

/**
 * 获取 reactElement 的类型
 */
function getEleType(ele: ReactElement) {
  // fixme: 非 react 的类型，有点儿问题。
  return typeof ele?.type === 'function' ? ele.type.name : ele?.type;
}

/**
 * 查找子元素（含孙子）下指定的类型的元素
 * @param tag 要查找的类型
 * @param children 子元素
 * @returns 目标元素
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

export function Html(props: { children: any[]; [x: string]: any }) {
  const { children } = props;

  // 处理默认组件与原有组件的兼容
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

  // todo: 或者直接抛错。在考虑兼容性
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
