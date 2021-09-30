import { sleep } from './helpers';
import { enable, disable } from '@/asyncHooksImpl';
import { createHooks } from '@/hook';

describe('hook', () => {
  it('should support sync runner', () => {
    type Hooks = {
      useCount: () => number;
    };

    const {
      run,
      hooks: { useCount },
    } = createHooks<Hooks>({
      useCount: () => {
        throw new Error(`useCount can't not be called after initilizing`);
      },
    });

    let count = 0;
    const implementations: Hooks = { useCount: () => count++ };
    run(() => {
      expect(useCount()).toBe(0);
      expect(useCount()).toBe(1);
      expect(useCount()).toBe(2);
      expect(useCount()).toBe(3);
    }, implementations);
  });

  it('should support async runner', async () => {
    type Hooks = {
      useCount: () => number;
    };

    const {
      run,
      hooks: { useCount },
    } = createHooks<Hooks>({
      useCount: () => {
        throw new Error(`useCount can't not be called after initilizing`);
      },
    });

    let count = 0;
    const implementations: Hooks = { useCount: () => count++ };

    enable();

    await run(async () => {
      expect(useCount()).toBe(0);
      await sleep(0);
      expect(useCount()).toBe(1);
      await sleep(0);
      expect(useCount()).toBe(2);
      await sleep(0);
      expect(useCount()).toBe(3);
    }, implementations);

    disable();
  });

  it('should use default hook with passing new one', () => {
    type Hooks = {
      useCount: () => number;
    };

    const {
      run,
      hooks: { useCount },
    } = createHooks<Hooks>({
      useCount: () => {
        throw new Error(`useCount can't not be called after initilizing`);
      },
    });

    enable();

    run(() => {
      expect(useCount).toThrowError(
        new Error(`useCount can't not be called after initilizing`),
      );
    });

    disable();
  });

  it('should fallback to default hook', () => {
    type Hooks = {
      useCount: () => number;
    };

    const {
      run,
      hooks: { useCount },
    } = createHooks<Hooks>({
      useCount: () => {
        throw new Error(`useCount can't not be called after initilizing`);
      },
    });

    const implementations: Hooks = { useCount: '' } as any;

    enable();

    run(() => {
      expect(useCount).toThrowError(
        new Error(`useCount can't not be called after initilizing`),
      );
    }, implementations);

    disable();
  });
});
