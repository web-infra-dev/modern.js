import { chalk } from '@modern-js/utils';
import { expect, describe, it } from 'vitest';
import {
  filterAsset,
  getDiffLabel,
  removeFileNameHash,
} from '@/plugins/fileSize';

describe('plugins/fileSize', () => {
  it('#filterAsset - should filter asset correctly', () => {
    expect(filterAsset('dist/a.js')).toBeTruthy();
    expect(filterAsset('dist/a.css')).toBeTruthy();
    expect(filterAsset('dist/a.js.map')).toBeFalsy();
    expect(filterAsset('dist/b.css.map')).toBeFalsy();
    expect(filterAsset('dist/a.png')).toBeFalsy();
  });

  it('#removeFileNameHash - should remove hash from file name correctly', () => {
    expect(removeFileNameHash('/dist', '/dist/main.8f1d8fa8.js')).toEqual(
      'main.js',
    );
    expect(removeFileNameHash('/dist', '/dist/main.8f1d8fa8.css')).toEqual(
      'main.css',
    );
  });

  it('#getDiffLabel - should return correct label', () => {
    expect(getDiffLabel(1000, 100, num => `${num / 1000}kb`)).toEqual(
      chalk.yellow('+0.9kb'),
    );
    expect(getDiffLabel(100, 1000, num => `${num / 1000}kb`)).toEqual(
      chalk.green('-0.9kb'),
    );
    expect(getDiffLabel(100000, 100, num => `${num / 1000}kb`)).toEqual(
      chalk.red('+99.9kb'),
    );
    expect(getDiffLabel(1000, 1000, num => `${num / 1000}kb`)).toEqual(
      chalk.green(''),
    );
  });
});
