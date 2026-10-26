import React from 'react';

declare global {
  var shouldUpdate: boolean | undefined;
}

export function SSRLiveReload() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: String.raw`
      if(${globalThis.shouldUpdate}){
        location.reload();
      }
   `,
      }}
    ></script>
  );
}
