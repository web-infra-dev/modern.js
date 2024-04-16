jest.mock('@modern-js/server-core/base/node', () => {
  const originalModule = jest.requireActual('@modern-js/server-core/base/node');

  return {
    ...originalModule,
    httpCallBack2HonoMid: jest.fn().mockImplementation(handler => {
      return handler;
    }),
  };
});
