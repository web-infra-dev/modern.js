import React from 'react';
import ReactDOM from 'react-dom';
import garfish from 'garfish';

export default () => {
  garfish.setExternal('react', React);
  garfish.setExternal('react-dom', ReactDOM);
};
