import path from 'node:path';
import { isSubDirOrEqual } from '../../src/plugins/analyze/utils';

describe('isSubDirOrEqual', () => {
  it('should return true for the same directories', () => {
    const parent = path.resolve('/Users/test');
    const child = path.resolve('/Users/test');
    expect(isSubDirOrEqual(parent, child)).toBe(true);
  });

  it('should return true for a child directory', () => {
    const parent = path.resolve('/Users');
    const child = path.resolve('/Users/test');
    expect(isSubDirOrEqual(parent, child)).toBe(true);
  });

  it('should return false for a non-child directory', () => {
    const parent = path.resolve('/Users/test');
    const child = path.resolve('/Users/anotherTest');
    expect(isSubDirOrEqual(parent, child)).toBe(false);
  });

  it('should return false for a directory at a higher level', () => {
    const parent = path.resolve('/Users/test/deeper');
    const child = path.resolve('/Users/test');
    expect(isSubDirOrEqual(parent, child)).toBe(false);
  });
});
