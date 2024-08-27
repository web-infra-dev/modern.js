import path from 'path-browserify';
import postcss from 'postcss';
import React from 'react';

export const main = async () => {
  console.info(React.version);
  console.info(path);
  console.info(postcss);
};
