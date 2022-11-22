import React from 'react';

export const debug = async (str: string) => {
  const { addPrefix } = await import('./common');
  addPrefix('DEBUG:', `${React.version}/${str}`);
};
