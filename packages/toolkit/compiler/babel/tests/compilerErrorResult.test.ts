import { CompilerErrorResult } from '../src/compilerErrorResult';

describe('CompilerErrorResult Class', () => {
  it('call constructor without params', () => {
    const cer_1 = new CompilerErrorResult();
    expect(Array.isArray(cer_1._messageDetails)).toBe(true);
    expect(cer_1._messageDetails.length).toBe(0);
  });

  it('call constructor with params', () => {
    const cer_1 = new CompilerErrorResult({ code: 1, message: 'fail' });
    expect(Array.isArray(cer_1._messageDetails)).toBe(true);
    expect(cer_1._messageDetails.length).toBe(0);

    const cer_2 = new CompilerErrorResult({
      code: 1,
      message: 'fail',
      messageDetails: [{ content: 'error', filename: 'far.js' }],
    });
    expect(Array.isArray(cer_1._messageDetails)).toBe(true);
    expect(cer_2._messageDetails.length).toBe(1);
  });

  it('use init', () => {
    const cer_1 = new CompilerErrorResult();
    cer_1.init({ code: 1, message: 'fail' });
    expect(Array.isArray(cer_1._messageDetails)).toBe(true);
    expect(cer_1._messageDetails.length).toBe(0);

    const cer_2 = new CompilerErrorResult();
    cer_2.init({
      code: 1,
      message: 'fail',
      messageDetails: [{ content: 'error', filename: 'far.js' }],
    });
    expect(Array.isArray(cer_1._messageDetails)).toBe(true);
    expect(cer_2._messageDetails.length).toBe(1);
  });

  it('update diff messageDetails', () => {
    const cer_1 = new CompilerErrorResult({ code: 1, message: 'fail' });
    const firstCount = cer_1._messageDetails.length;
    cer_1.update([{ content: 'error', filename: 'far.js' }]);
    const secondCount = cer_1._messageDetails.length;
    cer_1.update([{ content: 'error', filename: 'bar.js' }]);
    const thirdCount = cer_1._messageDetails.length;
    expect(firstCount).toBe(0);
    expect(secondCount).toBe(1);
    expect(thirdCount).toBe(2);
  });

  it('update same messageDetails', () => {
    const cer_1 = new CompilerErrorResult({ code: 1, message: 'fail' });
    const firstCount = cer_1._messageDetails.length;
    cer_1.update([{ content: 'error-1', filename: 'far.js' }]);
    const secondCount = cer_1._messageDetails.length;
    cer_1.update([{ content: 'error-2', filename: 'far.js' }]);
    const thirdCount = cer_1._messageDetails.length;
    expect(firstCount).toBe(0);
    expect(secondCount).toBe(1);
    expect(thirdCount).toBe(1);
  });

  it('remove by file name', () => {
    const cer_1 = new CompilerErrorResult({
      code: 1,
      message: 'fail',
      messageDetails: [{ content: 'error-1', filename: 'far.js' }],
    });
    const firstCount = cer_1._messageDetails.length;
    cer_1.removeByFileName('far.js');
    const secondCount = cer_1._messageDetails.length;
    expect(firstCount).toBe(1);
    expect(secondCount).toBe(0);
  });

  it('check exist error', () => {
    const cer_1 = new CompilerErrorResult();
    expect(cer_1.checkExistError()).toBe(false);
    const cer_2 = new CompilerErrorResult({
      code: 1,
      message: 'fail',
      messageDetails: [{ content: 'error-1', filename: 'far.js' }],
    });
    expect(cer_2.checkExistError()).toBe(true);
  });

  it('get value', () => {
    const cer_1 = new CompilerErrorResult();
    expect(cer_1.value).toStrictEqual({
      code: 1,
      message: `Compilation failure 0 files with Babel.`,
      messageDetails: [],
    });
    const cer_2 = new CompilerErrorResult({
      code: 1,
      message: 'fail',
      messageDetails: [{ content: 'error-1', filename: 'far.js' }],
    });
    expect(cer_2.value).toStrictEqual({
      code: 1,
      message: `Compilation failure 1 files with Babel.`,
      messageDetails: [{ content: 'error-1', filename: 'far.js' }],
    });
  });

  it('_messageDetails', () => {
    const cer_1 = new CompilerErrorResult();
    expect(cer_1._messageDetails).toStrictEqual([]);
    const cer_2 = new CompilerErrorResult({
      code: 1,
      message: 'fail',
      messageDetails: [{ content: 'error-1', filename: 'far.js' }],
    });
    expect(cer_2._messageDetails).toStrictEqual([
      { content: 'error-1', filename: 'far.js' },
    ]);
  });
});
