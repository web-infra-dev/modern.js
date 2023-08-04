import { expect } from 'chai';
import { isJsExt, isJsLoader, resolvePathAndQuery } from '../src';

describe('resolvePathAndQuery', () => {
  it('basic', () => {
    expect(resolvePathAndQuery('a')).deep.equal({ query: {}, rawQuery: undefined, originalFilePath: 'a' });
    expect(resolvePathAndQuery('a = 1')).deep.equal({ query: {}, rawQuery: undefined, originalFilePath: 'a = 1' });
    expect(resolvePathAndQuery('')).deep.equal({ query: {}, rawQuery: undefined, originalFilePath: '' });
    expect(resolvePathAndQuery('a?b=1&c&d=2')).deep.equal({
      query: { b: '1', c: true, d: '2' },
      rawQuery: 'b=1&c&d=2',
      originalFilePath: 'a',
    });
  });

  it('isJsExt', () => {
    expect(isJsExt('a.js')).to.be.true;
    expect(isJsExt('a.mjs')).to.be.true;
    expect(isJsExt('a.cjs')).to.be.true;
    expect(isJsExt('a.js?a=b')).to.be.true;
    expect(isJsExt('a.ts')).to.be.true;
    expect(isJsExt('a.ts?a=b')).to.be.true;
    expect(isJsExt('a.tsx')).to.be.true;
    expect(isJsExt('a.tsx?a=b')).to.be.true;
    expect(isJsExt('a.vue')).to.be.false;
    expect(isJsExt('a.vue?a=b')).to.be.false;
  });

  it('isJsLoader', () => {
    expect(isJsLoader('ts')).to.be.true;
    expect(isJsLoader('tsx')).to.be.true;
    expect(isJsLoader('js')).to.be.true;
    expect(isJsLoader('jsx')).to.be.true;
    expect(isJsLoader()).to.be.false;
  });
});
