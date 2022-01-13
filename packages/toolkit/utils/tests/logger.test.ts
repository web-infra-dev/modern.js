import { logger } from '../src/logger';

describe('logger', () => {
  test('should log', () => {
    // eslint-disable-next-line no-console
    console.log = jest.fn();

    logger.log('this is a log message');

    // eslint-disable-next-line no-console
    expect((console.log as jest.Mock).mock.calls[0][0]).toBe(
      'this is a log message',
    );

    logger.info('this is an info message');

    logger.warn('this is a warn message');

    logger.error(new Error('this is an error message'));

    // eslint-disable-next-line no-console
    expect(console.log as jest.Mock).toHaveBeenCalledTimes(4);
  });

  test('should create new logger', () => {
    // eslint-disable-next-line no-console
    console.log = jest.fn();

    const customLogger = new logger.Logger({
      config: {
        displayLabel: true,
        underlineLabel: false,
        uppercaseLabel: false,
      },
      types: {
        custom: {
          color: 'blue',
          label: 'custom',
          level: 'info',
        },
      },
    });

    customLogger.custom('custom log');

    const reg = new RegExp(`custom.*custom log$`);
    // eslint-disable-next-line no-console
    expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(reg);

    // eslint-disable-next-line no-console
    expect(console.log as jest.Mock).toHaveBeenCalledTimes(1);
  });
});
