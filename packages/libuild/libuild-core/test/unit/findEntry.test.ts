import assert from 'assert';
import { findEntry } from '../../src/bundler/adapter';

describe('findEntry', () => {
  it('default', () => {
    const entries = ['a.js', 'a-b.js'];
    assert(findEntry(entries, 'a.css') === 'a.js');
    assert(findEntry(entries, 'a-b.css') === 'a-b.js');
  });
});
