import React from 'react';
// import Head from './components/head';

// import 'react-dom';
// import react2 from 'react';
import { Document as OsDocument } from './Document/Document';
import Scripts from './Document/Scripts';
import Root from './Document/Root';
// import Head from './Document/Head';

export function Document(props: { a: string }): React.ReactElement {
  return (
    <OsDocument props={{ ...props }}>
      {/* <html> */}
      <head>
        {/* <Links /> */}
        <Scripts />
      </head>
      {/* <body> */}
      {/* <Head /> */}
      <h1 style={{ color: 'red' }}>good</h1>
      <h2>透传参数：{props.a}</h2>
      <Root />
      {/* </body> */}
      {/* </html> */}
    </OsDocument>
  );
}
