import { onExitProcess } from '../src/onExitProcess';

describe('on exit process', () => {
  it('should call listener after process exit', () => {
    const mockOn = jest
      .spyOn(process, 'on')
      .mockImplementation((event, listener): any => {
        if (event === 'exit') {
          listener();
        }
      });

    const fn = jest.fn();
    onExitProcess(fn);

    expect(fn).toHaveBeenCalledTimes(1);
    mockOn.mockRestore();
  });

  it('should call listener after process SIGINT', () => {
    const mockOn = jest
      .spyOn(process, 'on')
      .mockImplementation((event, listener): any => {
        if (event === 'SIGINT') {
          listener();
        }
      });

    const fn = jest.fn();
    onExitProcess(fn);

    expect(fn).toHaveBeenCalledTimes(1);
    mockOn.mockRestore();
  });
});
