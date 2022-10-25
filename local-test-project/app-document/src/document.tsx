import React from 'react';
import Head from './components/head';

export function Document(): React.ReactElement {
  return (
    <html>
      <head>{/* <Links /> */}</head>
      <body>
        <Head />
        <h1 style={{ color: 'red' }}>good</h1>
        {/* <Root /> */}
        {/* <Scripts /> */}
      </body>
    </html>
  );
}
