'use client';

// @ts-ignore
const React = require('react');

class ClassA extends React.Component {
  render() {
    return React.createElement('div');
  }
}

function ComponentA(arg0) {
  return React.createElement(`div`);
}

const MemoizedComponentA = React.memo(ComponentA);

const ComponentB = function () {
  return React.createElement(`div`);
};

const foo = 1;

// @ts-ignore
exports.ClassA = ClassA;
// @ts-ignore
exports.ComponentA = ComponentA;
// @ts-ignore
exports.MemoizedComponentA = MemoizedComponentA;
// @ts-ignore
exports.ComponentB = ComponentB;
// @ts-ignore
exports.foo = foo;

const bar = 2;

const ComponentF = () => React.createElement(`div`);

function D() {
  return React.createElement(`div`);
}

function ComponentE() {
  return React.createElement(`div`);
}

// @ts-ignore
module.exports = {
  ComponentD: D,
  bar,
  ComponentE,
  ComponentF
};
