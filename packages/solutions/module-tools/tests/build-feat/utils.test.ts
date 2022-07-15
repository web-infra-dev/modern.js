import path from 'path';
import {
  SectionTitleStatus,
  watchSectionTitle,
  getAllDeps,
} from '../../src/features/build/utils';

describe('watchSectionTitle', () => {
  test('SectionTitleStatus is success', () => {
    const ret = watchSectionTitle('test', SectionTitleStatus.Success);
    expect(ret.includes('Successful')).toBeTruthy();
    expect(ret.includes('test')).toBeTruthy();
  });

  test('SectionTitleStatus is fail', () => {
    const ret = watchSectionTitle('test', SectionTitleStatus.Fail);
    expect(ret.includes('Build Failed')).toBeTruthy();
    expect(ret.includes('test')).toBeTruthy();
  });

  test('SectionTitleStatus is log', () => {
    const ret = watchSectionTitle('test', SectionTitleStatus.Log);
    expect(ret.includes('Log')).toBeTruthy();
    expect(ret.includes('test')).toBeTruthy();
  });
});

describe('getAllDeps', () => {
  test('getAllDeps is success', () => {
    const ret = getAllDeps(path.join(__dirname, '../fixtures/ts-app'));
    expect(ret?.includes('sass')).toBeTruthy();
    expect(ret?.includes('less')).toBeFalsy();
  });
});
