import { Hono, run, useHonoContext } from '../../src';

describe('public request context', () => {
  it('keeps the Hono context across async work inside run', async () => {
    const app = new Hono();
    app.get('/scoped', c =>
      run(c, async () => {
        expect(useHonoContext()).toBe(c);
        await Promise.resolve();
        expect(useHonoContext()).toBe(c);
        return c.text(useHonoContext().req.path);
      }),
    );

    const response = await app.request('/scoped');
    expect(await response.text()).toBe('/scoped');
    expect(() => useHonoContext()).toThrowError(
      "Can't call useContext out of server scope",
    );
  });

  it('throws when reading outside of run scope', () => {
    expect(() => useHonoContext()).toThrowError(
      "Can't call useContext out of server scope",
    );
  });

  it('isolates contexts across concurrent requests', async () => {
    let release!: () => void;
    const bothEntered = new Promise<void>(resolve => {
      release = resolve;
    });
    let entered = 0;
    const app = new Hono();
    app.get('/:id', c =>
      run(c, async () => {
        if (++entered === 2) release();
        await bothEntered;
        expect(useHonoContext()).toBe(c);
        return c.text(useHonoContext().req.param('id'));
      }),
    );

    const responses = await Promise.all([
      app.request('/first'),
      app.request('/second'),
    ]);
    expect(
      await Promise.all(responses.map(response => response.text())),
    ).toEqual(['first', 'second']);
    expect(() => useHonoContext()).toThrowError(
      "Can't call useContext out of server scope",
    );
  });
});
