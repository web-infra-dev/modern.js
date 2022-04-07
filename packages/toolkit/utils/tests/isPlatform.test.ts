import { isNodeJS, isBrowser } from '../src/is/platform';

describe('validate platform', () => {
  it('should validate Node.js correctly', () => {
    expect(isNodeJS()).toBeTruthy();
  });

  it('should validate browser correctly', () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');

    windowSpy.mockImplementation((): any => undefined);
    expect(isBrowser()).toBeFalsy();

    windowSpy.mockImplementation((): any => global);
    expect(isBrowser()).toBeTruthy();

    windowSpy.mockRestore();
  });
});
