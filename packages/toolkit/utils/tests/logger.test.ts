import { logger } from '../src';

describe('logger', () => {
  test('should log', () => {
    console.log = jest.fn();

    logger.log('this is a log message');

    expect((console.log as jest.Mock).mock.calls[0][0]).toBe(
      'this is a log message',
    );

    logger.info('this is an info message');

    logger.warn('this is a warn message');

    logger.error(new Error('this is an error message'));

    logger.success('this is a success message');

    expect(console.log as jest.Mock).toHaveBeenCalledTimes(5);
  });

  test('should create new logger', () => {
    console.log = jest.fn();

    const customLogger = new logger.Logger({
      config: {
        displayLabel: true,
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
    expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(reg);

    expect(console.log as jest.Mock).toHaveBeenCalledTimes(1);
  });
});
