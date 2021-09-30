import {
  createContext,
  createContainer,
  useContainer,
  fromContainer,
  runHooks,
  isContext,
  assertContext,
  isContainer,
  assertContainer,
} from '@/context';

describe('context', () => {
  it('different values in Containers with same Context', () => {
    const Context0 = createContext({ count: 0 });

    const Context1 = createContext({ text: 'test' });

    const container = createContainer();

    expect(container.read(Context0)).toEqual({ count: 0 });

    expect(container.read(Context1)).toEqual({ text: 'test' });

    container.write(Context0, { count: 1 });

    expect(container.read(Context0)).toEqual({ count: 1 });

    container.write(Context1, { text: 'update test' });

    expect(container.read(Context1)).toEqual({ text: 'update test' });
  });

  it('inject new Context to Container', () => {
    const Context0 = createContext({ count: 0 });

    const Context1 = createContext({ text: 'test' });

    const container = createContainer({
      count: Context0.create({ count: 1 }),
      text: Context1.create({ text: 'new text' }),
    });

    expect(container.read(Context0)).toEqual({ count: 1 });

    expect(container.read(Context1)).toEqual({ text: 'new text' });
  });

  it('run hook with container', () => {
    const Context0 = createContext({ count: 0 });

    const Context1 = createContext({ text: 'test' });

    const container = createContainer({
      count: Context0.create({ count: 1 }),
      text: Context1.create({ text: 'new text' }),
    });

    runHooks(() => {
      const ctn = useContainer();

      expect(container === ctn).toBeTruthy();

      expect(ctn.read(Context0)).toEqual({ count: 1 });

      expect(ctn.read(Context1)).toEqual({ text: 'new text' });
    }, fromContainer(container));
  });

  it('assert Context', () => {
    const context = createContext<number | null>(null);

    const container = createContainer();

    runHooks(() => {
      expect(() => context.assert()).toThrowError();

      context.set(0);

      expect(context.assert()).toBe(0);
    }, fromContainer(container));
  });

  it('isContext', () => {
    const context = createContext(0);

    expect(isContext(context)).toBeTruthy();
    expect(isContext({})).toBeFalsy();
  });

  it('assertContext', () => {
    const context = createContext(0);

    assertContext(context);

    expect(() => assertContext({})).toThrowError();
  });

  it('isContainer', () => {
    const container = createContainer();

    expect(isContainer(container)).toBeTruthy();
    expect(isContainer({})).toBeFalsy();
    expect(isContainer(null)).toBeFalsy();
  });

  it('assertContainer', () => {
    const container = createContainer();

    assertContainer(container);

    expect(() => assertContainer({})).toThrowError();
  });
});
