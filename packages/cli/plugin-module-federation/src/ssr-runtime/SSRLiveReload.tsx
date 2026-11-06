import React from 'react';

export function SSRLiveReload({ shouldUpdate }: { shouldUpdate: boolean }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: String.raw`
      if(${shouldUpdate}){
        location.reload();
      }
   `,
      }}
    ></script>
  );
}
