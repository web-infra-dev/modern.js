import { expect, describe, it } from 'vitest';
import { filterAsset } from '@/plugins/fileSize';

describe('plugins/fileSize', () => {
  it('#filterAsset - should filter asset correctly', () => {
    expect(filterAsset('dist/a.js')).toBeTruthy();
    expect(filterAsset('dist/a.css')).toBeTruthy();
    expect(filterAsset('dist/a.js.map')).toBeFalsy();
    expect(filterAsset('dist/b.css.map')).toBeFalsy();
    expect(filterAsset('dist/a.png')).toBeTruthy();
  });
});
