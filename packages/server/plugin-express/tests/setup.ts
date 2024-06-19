jest.mock('@modern-js/server-core/node', () => {
  const originalModule = jest.requireActual('@modern-js/server-core/node');

  return {
    ...originalModule,
    httpCallBack2HonoMid: jest.fn().mockImplementation(handler => {
      return handler;
    }),
  };
});
