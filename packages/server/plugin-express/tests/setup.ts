jest.mock('@modern-js/server-core/base', () => {
  const originalModule = jest.requireActual('@modern-js/server-core/base');

  return {
    ...originalModule,
    httpCallBack2HonoMid: jest.fn().mockImplementation(handler => {
      return handler;
    }),
  };
});
