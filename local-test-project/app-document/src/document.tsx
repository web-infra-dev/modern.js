import React from 'react';
import Head from './components/head';

export function Document(): React.ReactElement {
  return (
    <html>
      <head>{/* <Links /> */}</head>
      <body>
        <Head />
        {/* <Root /> */}
        {/* <Scripts /> */}
      </body>
    </html>
  );
}
