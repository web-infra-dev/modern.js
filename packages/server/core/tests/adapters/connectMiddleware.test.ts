import { EventEmitter } from 'node:events';
import { connectMid2HonoMid } from '../../src/adapters/node/hono';

const createContext = () => {
  const req = new EventEmitter();
  const res = new EventEmitter();
  const context = { env: { node: { req, res } }, res: undefined } as any;
  return { context, res };
};

describe('connectMid2HonoMid', () => {
  it('settles when a three-argument middleware answers without next', async () => {
    const { context, res } = createContext();
    const next = rstest.fn(async () => {});
    const middleware = connectMid2HonoMid((_req, _res, _next) => {
      setTimeout(() => res.emit('finish'), 0);
    });

    await middleware(context, next);

    expect(context.finalized).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it('continues the chain when the middleware calls next', async () => {
    const { context, res } = createContext();
    const next = rstest.fn(async () => {
      res.emit('finish');
    });
    const middleware = connectMid2HonoMid((_req, _res, done) => done());

    await middleware(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(context.finalized).toBeUndefined();
  });

  it('rejects with the error the middleware passes to next', async () => {
    const { context } = createContext();
    const middleware = connectMid2HonoMid((_req, _res, done) =>
      done(new Error('boom')),
    );

    await expect(middleware(context, async () => {})).rejects.toThrow('boom');
  });
});
