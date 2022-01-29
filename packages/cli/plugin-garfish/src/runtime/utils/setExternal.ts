import React from 'react';
import ReactDOM from 'react-dom';
import garfish from 'garfish';
import { logger } from 'src/util';

export default () => {
  logger('setExternal ', { react: React, 'react-dom': ReactDOM });
  garfish.setExternal('react', React);
  garfish.setExternal('react-dom', ReactDOM);
};
