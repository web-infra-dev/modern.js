// import { useContext } from 'react';
// import { DocumentContext } from '../../../../packages/cli/webpack/src/config/DocumentContext';
// import { DocumentContext } from './DocumentContext';

export function Document(props: { children: any[]; [x: string]: any }) {
  const {
    children,
    // ...t
  } = props;
  function findTargetChild(tag: string) {
    return children.find(item => {
      const reallyType = item.type || item.type.name;
      // console.log('+++> item: ', reallyType);
      return reallyType === tag;
    });
  }
  // console.log('===> t: ', t, props);
  // 遍历 children 有则匹配，无则用默认替换
  return (
    <html>
      {/* <DocumentContext.Provider value={{ ...t }}> */}
      {findTargetChild('Head') || (
        <head>
          <meta content="adf"></meta>
        </head>
      )}
      <body>
        {findTargetChild('Root') || <div id="root"></div>}
        {props.children}
      </body>
      {/* </DocumentContext.Provider> */}
    </html>
  );
}
