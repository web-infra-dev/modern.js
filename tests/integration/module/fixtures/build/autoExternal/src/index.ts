import React from 'react';
import postcss from 'postcss';
import path from 'path-browserify';

export const main = async () => {
  console.info(React.version);
  console.info(path);
  console.info(postcss);
};
