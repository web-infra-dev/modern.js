// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import {
  createPipeline,
  createAsyncPipeline,
  createContext,
  createContainer,
} from 'farrow-pipeline';
import { main } from './fixtures/sync/core';
import foo from './fixtures/sync/base/foo';
import bar, { getBar } from './fixtures/sync/base/bar';
import dFoo from './fixtures/sync/dynamic/foo';
import dBar, { getNumber, setNumber } from './fixtures/sync/dynamic/bar';
import { createManager, createAsyncManager, useRunner } from '../src/manager';
import { createWaterfall, createAsyncWaterfall } from '../src/waterfall';
import {
  createWorkflow,
  createAsyncWorkflow,
  createParallelWorkflow,
} from '../src/workflow';

describe('sync manager', () => {
  it('base useage', () => {
    const countContext = createContext(0);
    const useCount = () => countContext.use().value;
    const manager = createManager();

    manager.usePlugin(
      manager.createPlugin(() => {
        expect(useCount()).toBe(1);
      }),
    );

    manager.run(() => {
      countContext.set(1);
    });

    expect(manager.run(() => countContext.get())).toBe(1);
  });

  it('with sub waterfall', () => {
    type Context = {
      count: number;
    };

    type Config = {
      mode: string;
    };

    const prepare = createWaterfall<{
      config: Config;
    }>();

    const preDev = createWaterfall<{
      context: Context;
    }>();

    const postDev = createWaterfall<{
      context: Context;
    }>();

    const manager = createManager({ prepare, preDev, postDev });

    const runner = manager.init();

    const prepareResult = runner.prepare({ config: { mode: 'test' } });
    const preDevResult = runner.preDev({ context: { count: 0 } });
    const postDevResult = runner.postDev({ context: { count: 1 } });

    expect(prepareResult).toStrictEqual({ config: { mode: 'test' } });
    expect(preDevResult).toStrictEqual({ context: { count: 0 } });
    expect(postDevResult).toStrictEqual({ context: { count: 1 } });
  });

  it('could without progress hook in plugin', () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const foo = createWaterfall<number>();
    const manager = createManager({ foo });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const plugin = manager.createPlugin(() => {});
    manager.usePlugin(plugin);

    const runner = manager.init();

    expect(runner.foo(0)).toBe(0);
  });

  describe('pre order plugin', () => {
    it('default order is right order', () => {
      const manager = createManager();

      const list: number[] = [];
      const plugin0 = manager.createPlugin(
        () => {
          list.push(0);
        },
        { name: 'plugin0' },
      );
      const plugin1 = manager.createPlugin(
        () => {
          list.push(1);
        },
        {
          name: 'plugin1',
          pre: ['plugin0'],
        },
      );
      const plugin2 = manager.createPlugin(
        () => {
          list.push(2);
        },
        { name: 'plugin2' },
      );

      manager.usePlugin(plugin0, plugin1, plugin2);

      manager.init();

      expect(list).toStrictEqual([0, 1, 2]);
    });

    it('default order is incorrect order', () => {
      const manager = createManager();

      const list: number[] = [];
      const plugin0 = manager.createPlugin(
        () => {
          list.push(0);
        },
        {
          name: 'plugin0',
          pre: ['plugin1'],
        },
      );
      const plugin1 = manager.createPlugin(
        () => {
          list.push(1);
        },
        { name: 'plugin1' },
      );
      const plugin2 = manager.createPlugin(
        () => {
          list.push(2);
        },
        { name: 'plugin2' },
      );

      manager.usePlugin(plugin0, plugin1, plugin2);

      manager.init();

      expect(list).toStrictEqual([1, 0, 2]);
    });
  });

  describe('post order plugin', () => {
    it('default order is right order', () => {
      const manager = createManager();

      const list: number[] = [];
      const plugin0 = manager.createPlugin(
        () => {
          list.push(0);
        },
        {
          name: 'plugin0',
          post: ['plugin1'],
        },
      );
      const plugin1 = manager.createPlugin(
        () => {
          list.push(1);
        },
        { name: 'plugin1' },
      );
      const plugin2 = manager.createPlugin(
        () => {
          list.push(2);
        },
        { name: 'plugin2' },
      );

      manager.usePlugin(plugin0, plugin1, plugin2);

      manager.init();

      expect(list).toStrictEqual([0, 1, 2]);
    });

    it('default order is incorrect order', () => {
      const manager = createManager();

      const list: number[] = [];
      const plugin0 = manager.createPlugin(
        () => {
          list.push(0);
        },
        { name: 'plugin0' },
      );
      const plugin1 = manager.createPlugin(
        () => {
          list.push(1);
        },
        {
          name: 'plugin1',
          post: ['plugin0'],
        },
      );
      const plugin2 = manager.createPlugin(
        () => {
          list.push(2);
        },
        { name: 'plugin2' },
      );

      manager.usePlugin(plugin0, plugin1, plugin2);

      manager.init();

      expect(list).toStrictEqual([1, 0, 2]);
    });

    it('should support more plugin', () => {
      const manager = createManager();

      let status = 0;
      const plugin1 = manager.createPlugin(
        () => {
          status = 1;
        },
        { name: 'plugin1' },
      );

      const plugin2 = manager.createPlugin(() => {
        status = 2;
      });

      const plugin3 = manager.createPlugin(() => {
        status = 3;
      });

      const plugin4 = manager.createPlugin(
        () => {
          status = 4;
        },
        { post: ['plugin1'] },
      );

      manager.usePlugin(plugin1);
      manager.usePlugin(plugin2);
      manager.usePlugin(plugin3);
      manager.usePlugin(plugin4);

      manager.init({});

      expect(status).toBe(1);
    });
  });

  describe('rivals plugin', () => {
    it('should throw error when attaching rival plugin', () => {
      const manager = createManager();

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const plugin1 = manager.createPlugin(() => {}, { name: 'plugin1' });

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const plugin2 = manager.createPlugin(() => {}, { rivals: ['plugin1'] });

      manager.usePlugin(plugin1);
      manager.usePlugin(plugin2);

      expect(() => manager.init({})).toThrowError();
    });

    it('should not throw error without attaching rival plugin', () => {
      const manager = createManager();

      let count = 0;
      const plugin0 = manager.createPlugin(
        () => {
          count = 0;
        },
        { name: 'plugin0' },
      );
      const plugin1 = manager.createPlugin(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          count += 1;
        },
        {
          name: 'plugin1',
          rivals: ['plugin2'],
        },
      );

      manager.usePlugin(plugin0, plugin1);

      manager.init();
    });
  });

  describe('required plugin', () => {
    it('should throw error when it is without required plugin', () => {
      const manager = createManager();

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const plugin0 = manager.createPlugin(() => {}, {
        name: 'plugin0',
        required: ['plugin1'],
      });

      manager.usePlugin(plugin0);

      expect(manager.init).toThrowError();
    });

    it('should not throw error without attaching rival plugin', () => {
      const manager = createManager();

      let count = 0;
      const plugin0 = manager.createPlugin(
        () => {
          count = 0;
        },
        {
          name: 'plugin0',
          required: ['plugin1'],
        },
      );
      const plugin1 = manager.createPlugin(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          count += 1;
        },
        { name: 'plugin1' },
      );

      manager.usePlugin(plugin0, plugin1);

      manager.init();
    });
  });

  it('common attach plugin', () => {
    const manager = main.clone().usePlugin(foo).usePlugin(bar);

    expect(getBar()).toBe(0);

    const runner = manager.init();

    expect(getBar()).toBe(1);

    runner.preDev();

    expect(getBar()).toBe(2);

    runner.postDev();

    expect(getBar()).toBe(3);
  });

  it('should support dynamic register', () => {
    const manager = main.clone().usePlugin(dFoo).usePlugin(dBar);

    expect(getNumber()).toBe(0);

    const runner = manager.init();

    expect(getNumber()).toBe(1);

    runner.preDev();

    expect(getNumber()).toBe(2);
  });

  it('should de-duplicate plugins', () => {
    const manager = createManager();

    let count = 0;
    const plugin = manager.createPlugin(() => {
      count += 1;
    });

    manager.usePlugin(plugin, plugin);
    manager.usePlugin(plugin);

    manager.init();

    expect(count).toBe(1);
  });

  it('isPlugin: exclusive plugins of manager', () => {
    const manager0 = createAsyncManager();
    const manager1 = createManager();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const plugin = manager0.createPlugin(() => {});

    expect(manager0.isPlugin(plugin)).toBeTruthy();
    expect(manager1.isPlugin(plugin)).toBeFalsy();
    expect(manager1.isPlugin({})).toBeFalsy();
    expect(manager1.isPlugin('' as any)).toBeFalsy();
  });

  it('usePlugin: exclusive plugins of manager', () => {
    const manager0 = createAsyncManager();
    const manager1 = createManager();

    let count = 0;
    const plugin = manager0.createPlugin(() => {
      count += 1;
    });

    manager1.usePlugin(plugin as any);
    manager1.init();

    expect(count).toBe(0);
  });

  it('should support clear plugins', () => {
    setNumber(0);

    const manager = main.clone().usePlugin(dFoo).usePlugin(dBar);

    manager.clear();

    expect(getNumber()).toBe(0);

    const runner = manager.init();

    expect(getNumber()).toBe(0);

    runner.preDev();

    expect(getNumber()).toBe(0);
  });

  it('should run under the internal container', () => {
    const manager = createManager();
    const Count = createContext(0);

    const plugin = manager.createPlugin(() => {
      Count.set(1);
    });

    manager.usePlugin(plugin);

    manager.init();
    expect(manager.run(Count.get)).toBe(1);

    const container = createContainer();

    manager.init({ container });
    expect(manager.run(Count.get, { container })).toBe(1);
  });

  it('should support all progress', async () => {
    const manager = createManager({
      pipeline: createPipeline(),
      asyncPipeline: createAsyncPipeline(),
      waterfall: createWaterfall(),
      asyncWaterfall: createAsyncWaterfall(),
      workflow: createWorkflow(),
      asyncWorkflow: createAsyncWorkflow(),
      parallelWorkflow: createParallelWorkflow(),
    });

    const list: string[] = [];
    const plugin = manager.createPlugin(() => ({
      pipeline: () => {
        list.push('pipeline');
      },
      asyncPipeline: () => {
        list.push('asyncPipeline');
      },
      waterfall: () => {
        list.push('waterfall');
      },
      asyncWaterfall: () => {
        list.push('asyncWaterfall');
      },
      workflow: () => {
        list.push('workflow');
      },
      asyncWorkflow: () => {
        list.push('asyncWorkflow');
      },
      parallelWorkflow: () => {
        list.push('parallelWorkflow');
      },
    }));
    manager.usePlugin(plugin);

    const runner = manager.init();

    runner.pipeline({});
    await runner.asyncPipeline({});
    runner.waterfall({});
    await runner.asyncWaterfall({});
    runner.workflow({});
    await runner.asyncWorkflow({});
    await runner.parallelWorkflow({});

    expect(list).toStrictEqual([
      'pipeline',
      'asyncPipeline',
      'waterfall',
      'asyncWaterfall',
      'workflow',
      'asyncWorkflow',
      'parallelWorkflow',
    ]);
  });

  it('should throw error when progress is illegal', () => {
    const manager = createManager({ test: '' as any });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const plugin = manager.createPlugin(() => {});

    manager.usePlugin(plugin);

    expect(manager.init).toThrowError();
  });

  describe('useRunner', () => {
    it('base usage', () => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const foo = createPipeline();
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const bar = createPipeline();
      const manager = createManager({ foo, bar });

      let count = 0;

      const plugin = manager.createPlugin(() => ({
        foo: () => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const runner = useRunner();
          runner.bar();
        },
        bar: () => {
          count = 1;
        },
      }));
      manager.usePlugin(plugin);

      const runner = manager.init();
      runner.foo({});

      expect(count).toBe(1);
    });

    it('can not use useRunner out plugin hook', () => {
      expect(useRunner).toThrowError(
        new Error(
          `Can't call useContainer out of scope, it should be placed on top of the function`,
        ),
      );
    });
  });
});
