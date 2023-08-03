import { expect } from 'chai';
import { isEmpty, isObject, isDef, isEmptyObject } from '../src';

describe('isEmpty', () => {
  it('false', () => {
    expect(isEmpty('')).to.be.false;
    expect(isEmpty(1)).to.be.false;
    expect(isEmpty([])).to.be.false;
    expect(isEmpty(BigInt(1))).to.be.false;
    expect(isEmpty(new Set())).to.be.false;
    expect(isEmpty(new Map())).to.be.false;
    expect(isEmpty({})).to.be.false;
    expect(isEmpty(new Object())).to.be.false;
  });

  it('true', () => {
    expect(isEmpty(null)).to.be.true;
    expect(isEmpty(undefined)).to.be.true;
  });
});

describe('isDef', () => {
  it('true', () => {
    expect(isDef('')).to.be.true;
    expect(isDef(1)).to.be.true;
    expect(isDef([])).to.be.true;
    expect(isDef(BigInt(1))).to.be.true;
    expect(isDef(new Set())).to.be.true;
    expect(isDef(new Map())).to.be.true;
    expect(isDef({})).to.be.true;
    expect(isDef(new Object())).to.be.true;
  });

  it('false', () => {
    expect(isDef(null)).to.be.false;
    expect(isDef(undefined)).to.be.false;
  });
});

describe('isObject', () => {
  it('not object', () => {
    expect(isObject('')).to.be.false;
    expect(isObject(1)).to.be.false;
    expect(isObject([])).to.be.false;
    expect(isObject(BigInt(1))).to.be.false;
    expect(isObject(new Set())).to.be.false;
    expect(isObject(new Map())).to.be.false;
  });

  it('is object', () => {
    expect(isObject({})).to.be.true;
    expect(isObject(new Object())).to.be.true;
  });
});

describe('isEmptyObject', () => {
  it('not emptyObject', () => {
    expect(isEmptyObject('')).to.be.false;
    expect(isEmptyObject(1)).to.be.false;
    expect(isEmptyObject([])).to.be.false;
    expect(isEmptyObject(BigInt(1))).to.be.false;
    expect(isEmptyObject(new Set())).to.be.false;
    expect(isEmptyObject(new Map())).to.be.false;
    expect(isEmptyObject({ name: 'foo' })).to.be.false;
  });

  it('is emptyObject', () => {
    expect(isObject({})).to.be.true;
    expect(isObject(new Object())).to.be.true;
  });
});
