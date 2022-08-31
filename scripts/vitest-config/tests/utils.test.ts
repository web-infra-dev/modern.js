import { describe, it, expect } from 'vitest';
import {
  compilePathMatcherSource,
  createSnapshotSerializer,
  joinPathParts,
  upwardPaths,
} from '../src/utils';

describe('joinPathParts', () => {
  it('should join path parts', () => {
    expect(joinPathParts('whatever', 0, ['a', 'b', 'c'])).toBe('/a');
    expect(joinPathParts('whatever', 1, ['a', 'b', 'c'])).toBe('/a/b');
    expect(joinPathParts('whatever', 2, ['a', 'b', 'c'])).toBe('/a/b/c');
  });
});

describe('upwardPaths', () => {
  it('should get upward paths', () => {
    expect(upwardPaths('/a/b/c')).toEqual(['/a/b/c', '/a/b', '/a', '/']);
  });
});

describe('compilePathMatcherSource', () => {
  it('should compile string path matcher', () => {
    const regExpSource = compilePathMatcherSource('/a/b/c');
    const regExp = new RegExp(regExpSource);
    expect(regExpSource).toBe('^/a/b/c(?=/)|^/a/b/c$');
    expect(regExp.test('/a/b/c')).toBe(true);
    expect(regExp.test('/a/b/c/')).toBe(true);
    expect(regExp.test('/a/b/c/d')).toBe(true);
    expect(regExp.test('/a/b/cd')).toBe(false);
    expect(regExp.test('/a/c/c/')).toBe(false);
  });
});

describe('createSnapshotSerializer', () => {
  it('should create snapshot serializer', () => {
    const serializer = createSnapshotSerializer({
      replace: [
        { match: '/a/b/c', mark: 'root' },
        { match: '/a/b/c/d', mark: 'workspace' },
        { match: '/a/b/c/d/e', mark: 'workspace2' },
      ],
    });
    expect.addSnapshotSerializer(serializer);
    expect('/a/b/c/d/e/f/g').toMatchInlineSnapshot('"<ROOT>/d/e/f/g"');
    expect('/a/b/c/foo').toMatchInlineSnapshot('"<ROOT>/foo"');
    expect('/a/b/foo/bar').toMatchInlineSnapshot('"<UNKNOWN>/foo/bar"');
  });
});
