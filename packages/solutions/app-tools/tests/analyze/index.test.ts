import * as path from 'path';

describe('analyze', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  const mockContext: any = {
    context: {
      appDirectory: path.join(__dirname, './fixtures/server-routes/exist-src'),
    },
    get() {
      return this.context;
    },
    set(newContext: any) {
      Object.assign(this.context, newContext);
    },
  };
});
