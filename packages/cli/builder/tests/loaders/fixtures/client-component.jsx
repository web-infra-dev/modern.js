'use client';

import * as React from 'react';

export class ClassA extends React.Component {
  render() {
    return React.createElement('div');
  }
}

export function ComponentA(arg0) {
  return React.createElement(`div`);
}

export const MemoizedComponentA = React.memo(ComponentA);

export const ComponentB = function () {
  return React.createElement(`div`);
};

export const foo = 1;

export { ClientComponentWithServerAction as ComponentC } from './client-component-with-server-action.js';

const bar = 2;

const ComponentF = () => React.createElement(`div`);

export { D as ComponentD, bar, ComponentE, ComponentF };

function D() {
  return React.createElement(`div`);
}

function ComponentE() {
  return React.createElement(`div`);
}

export default function () {
  return null;
}
