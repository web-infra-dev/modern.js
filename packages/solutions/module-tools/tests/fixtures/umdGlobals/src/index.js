import React from 'react';

export const debug = async str => {
  const { addPrefix } = await import('./common');
  addPrefix('DEBUG:', `${React.version}/${str}`);
};
