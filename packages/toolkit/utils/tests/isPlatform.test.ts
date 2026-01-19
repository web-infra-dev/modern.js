import { isBrowser } from '../src';

describe('validate platform', () => {
  it('should validate browser correctly', () => {
    const windowSpy = rstest.spyOn(window, 'window', 'get');

    windowSpy.mockImplementation((): any => undefined);
    expect(isBrowser()).toBeFalsy();

    windowSpy.mockImplementation((): any => global);
    expect(isBrowser()).toBeTruthy();

    windowSpy.mockRestore();
  });
});
