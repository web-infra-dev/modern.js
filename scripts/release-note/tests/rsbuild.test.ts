import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatRsbuildUpgradeNote, getVersionsBetween } from '../src/rsbuild';

describe('getVersionsBetween', () => {
  it('lists patch versions in the same minor range', () => {
    assert.deepEqual(getVersionsBetween('2.0.0', '2.0.3'), [
      '2.0.1',
      '2.0.2',
      '2.0.3',
    ]);
  });

  it('uses bounded minor release boundaries', () => {
    assert.deepEqual(getVersionsBetween('2.0.3', '2.2.1'), ['2.1.0', '2.2.1']);
  });

  it('uses bounded major release boundaries', () => {
    assert.deepEqual(getVersionsBetween('1.9.3', '3.1.0'), [
      '2.0.0',
      '3.0.0',
      '3.1.0',
    ]);
  });

  it('keeps prerelease ranges finite', () => {
    assert.deepEqual(getVersionsBetween('2.0.0-alpha.0', '2.0.0-alpha.2'), [
      '2.0.0-alpha.1',
      '2.0.0-alpha.2',
    ]);
  });

  it('formats Chinese upgrade links with localized separators', () => {
    const note = formatRsbuildUpgradeNote('1.5.0', '2.1.0', 'zh');

    assert.match(note.summary_zh, /v2\.0\.0.*和.*v2\.1\.0/);
  });
});
