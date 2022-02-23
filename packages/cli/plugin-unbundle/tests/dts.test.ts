import { parseDTS } from '../src/parse-dts';

const fs = require('fs');

jest.mock('fs');

describe('dts test', () => {
  test('dts parse test ', () => {
    fs.existsSync.mockReturnValue(false);
    const enums = parseDTS(['modern.config.ts']);
    expect(enums).toMatchObject({});
  });
});

export {};
