// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import {
  createPipeline,
  createAsyncPipeline,
  createContext,
} from '../src/farrow-pipeline';
import type { PluginOptions, AsyncSetup } from '../src';
import { createManager, createAsyncManager } from '../src/manager';
import { createWaterfall, createAsyncWaterfall } from '../src/waterfall';
import {
  createWorkflow,
  createAsyncWorkflow,
  createParallelWorkflow,
} from '../src/workflow';
import { main, TestAsyncHooks, TestAsyncPlugin } from './fixtures/async/core';
import foo from './fixtures/async/base/foo';
import bar, { getBar } from './fixtures/async/base/bar';
import dFoo from './fixtures/async/dynamic/foo';
import dBar, { getNumber } from './fixtures/async/dynamic/bar';
import { sleep } from './helpers';

describe('async manager', () => {
  it('base usage', async () => {
    const manager = main.clone().usePlugin(foo).usePlugin(bar);

    expect(getBar()).toBe(0);

    const runner = await manager.init();

    expect(getBar()).toBe(1);

    runner.preDev();

    expect(getBar()).toBe(2);

    runner.postDev();

    expect(getBar()).toBe(3);
  });

  it('should support async setup function', async () => {
    const manager = createAsyncManager();

    const countContext = createContext(0);
    const useCount = () => countContext.use().value;

    const plugin = manager.createPlugin(async () => {
      await sleep(0);
      expect(useCount()).toBe(1);
    });
    manager.usePlugin(plugin);

    countContext.set(1);

    await manager.init();

    const result0 = countContext.get();

    expect(result0).toBe(1);
  });

  it('support support dynamicly register', async () => {
    const manager = main.clone().usePlugin(dFoo).usePlugin(dBar);

    expect(getNumber()).toBe(0);

    const runner = await manager.init();

    expect(getNumber()).toBe(1);

    runner.preDev();

    expect(getNumber()).toBe(2);
  });

  it('could without progress hook in plugin', async () => {
    const foo = createWaterfall<number>();
    const manager = createAsyncManager({ foo });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const plugin = manager.createPlugin(() => {});
    manager.usePlugin(plugin);

    const runner = await manager.init();

    expect(runner.foo(0)).toBe(0);
  });

  describe('pre order plugin', () => {
    it('default order is right order', async () => {
      const manager = createAsyncManager();

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

      await manager.init();

      expect(list).toStrictEqual([0, 1, 2]);
    });

    it('default order is incorrect order', async () => {
      const manager = createAsyncManager();

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

      await manager.init();

      expect(list).toStrictEqual([1, 0, 2]);
    });
  });

  describe('post order plugin', () => {
    it('default order is right order', async () => {
      const manager = createAsyncManager();

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

      await manager.init();

      expect(list).toStrictEqual([0, 1, 2]);
    });

    it('default order is incorrect order', async () => {
      const manager = createAsyncManager();

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

      await manager.init();

      expect(list).toStrictEqual([1, 0, 2]);
    });

    it('should support more plugin', async () => {
      const manager = createAsyncManager();

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

      await manager.init();

      expect(status).toBe(1);
    });
  });

  describe('rival plugin', () => {
    it('should throw error when attaching rival plugin', async () => {
      const manager = createAsyncManager();

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
          rivals: ['plugin0'],
        },
      );

      manager.usePlugin(plugin0, plugin1);

      await expect(manager.init).rejects.toThrowError();
    });

    it('should not throw error without attaching rival plugin', async () => {
      const manager = createAsyncManager();

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

      await manager.init();
    });
  });

  describe('required plugin', () => {
    it('should throw error when it is without required plugin', async () => {
      const manager = createAsyncManager();

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const plugin0 = manager.createPlugin(() => {}, {
        name: 'plugin0',
        required: ['plugin1'],
      });

      manager.usePlugin(plugin0);

      await expect(manager.init).rejects.toThrowError();
    });

    it('should not throw error without attaching rival plugin', async () => {
      const manager = createAsyncManager();

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

      await manager.init();
    });
  });

  it('should de-duplicate plugins', async () => {
    const manager = createAsyncManager();

    let count = 0;
    const plugin = manager.createPlugin(() => {
      count += 1;
    });

    manager.usePlugin(plugin, plugin);
    manager.usePlugin(plugin);

    await manager.init();

    expect(count).toBe(1);
  });

  it('should support manager clone', async () => {
    const manager0 = createAsyncManager();

    let count = 0;
    const plugin = manager0.createPlugin(() => {
      count += 1;
    });

    manager0.usePlugin(plugin);
    await manager0.init();

    expect(count).toBe(1);

    const manager1 = manager0.clone();
    manager1.usePlugin(plugin);
    await manager1.init();

    expect(count).toBe(2);
  });

  it('should support manager clone and override pluginAPI', done => {
    const myAPI = { hello: () => 1 };
    const manager = createAsyncManager({}, myAPI);
    const plugin = {
      setup(api: typeof myAPI) {
        expect(api.hello()).toEqual(2);
        done();
      },
    };
    const clonedManager = manager.clone({
      hello: () => 2,
    });

    clonedManager.usePlugin(plugin).init();
  });

  it('isPlugin if exclusive plugins of manager', () => {
    const manager0 = createManager();
    const manager1 = createAsyncManager();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const plugin = manager0.createPlugin(() => {});

    expect(manager0.isPlugin(plugin)).toBeTruthy();
    expect(manager1.isPlugin(plugin)).toBeFalsy();
    expect(manager1.isPlugin({})).toBeFalsy();
    expect(manager1.isPlugin('' as any)).toBeFalsy();
  });

  it('should support clear plugins', async () => {
    const manager = createAsyncManager();

    let count = 0;
    const plugin = manager.createPlugin(() => {
      count += 1;
    });

    manager.usePlugin(plugin);
    manager.clear();

    await manager.init();

    expect(count).toBe(0);
  });

  it('should run under the internal container', async () => {
    const manager = createAsyncManager();
    const Count = createContext(0);

    const plugin = manager.createPlugin(() => {
      Count.set(1);
    });

    manager.usePlugin(plugin);

    await manager.init();
    expect(Count.get()).toBe(1);

    await manager.init();
    expect(Count.get()).toBe(1);
  });

  it('should support all progress', async () => {
    const manager = createAsyncManager({
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

    const runner = await manager.init();

    runner.pipeline({});
    await runner.asyncPipeline({});
    runner.waterfall();
    await runner.asyncWaterfall();
    runner.workflow();
    await runner.asyncWorkflow();
    await runner.parallelWorkflow();

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

  describe('useRunner', () => {
    it('should work well', async () => {
      const foo = createAsyncPipeline();
      const bar = createAsyncPipeline();
      const manager = createAsyncManager({ foo, bar });

      let count = 0;

      const plugin = manager.createPlugin(() => ({
        foo: async () => {
          await sleep(0);
          const runner = manager.useRunner();
          runner.bar({});
        },
        bar: () => {
          count = 1;
        },
      }));

      manager.usePlugin(plugin);

      const runner = await manager.init();

      await runner.foo({});

      expect(count).toBe(1);
    });
  });

  describe('setup api', () => {
    it('should allow to access api.useHookRunners by default', done => {
      const manager = createAsyncManager<TestAsyncHooks>();
      const plugin: TestAsyncPlugin = {
        name: 'plugin',
        setup: api => {
          expect(api.useHookRunners).toBeTruthy();
          done();
        },
      };
      manager.usePlugin(plugin);
      manager.init();
    });

    it('should allow to register extra api', done => {
      type API = { foo: () => void };

      const manager = createAsyncManager<TestAsyncHooks, API>(
        {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { foo: () => {} },
      );

      const plugin: PluginOptions<
        TestAsyncHooks,
        AsyncSetup<TestAsyncHooks, API>
      > = {
        name: 'plugin',
        setup: api => {
          expect(api.foo).toBeTruthy();
          done();
        },
      };

      manager.usePlugin(plugin);
      manager.init();
    });
  });

  describe('usePlugins option', () => {
    it('should allow to use single plugin', async () => {
      const manager = createAsyncManager<TestAsyncHooks>();

      const list: number[] = [];
      const plugin0: TestAsyncPlugin = {
        name: 'plugin0',
        setup: () => {
          list.push(0);
        },
      };

      const plugin1: TestAsyncPlugin = {
        name: 'plugin1',
        usePlugins: [plugin0],
        setup: () => {
          list.push(1);
        },
      };

      manager.usePlugin(plugin1);

      await manager.init();

      expect(list).toStrictEqual([0, 1]);
    });

    it('should allow to use multiple plugins', async () => {
      const manager = createAsyncManager<TestAsyncHooks>();

      const list: number[] = [];
      const plugin0: TestAsyncPlugin = {
        name: 'plugin0',
        setup: () => {
          list.push(0);
        },
      };

      const plugin1 = {
        name: 'plugin1',
        usePlugins: [plugin0],
        setup: () => {
          list.push(1);
        },
      };

      const plugin2 = {
        name: 'plugin2',
        usePlugins: [plugin1],
        setup: () => {
          list.push(2);
        },
      };

      manager.usePlugin(plugin2);

      await manager.init();

      expect(list).toStrictEqual([0, 1, 2]);
    });

    it('should allow to use plugin without setup function', async () => {
      const manager = createAsyncManager<TestAsyncHooks>();

      const list: number[] = [];
      const plugin0: TestAsyncPlugin = {
        name: 'plugin0',
        setup: () => {
          list.push(0);
        },
      };

      const plugin1 = {
        name: 'plugin1',
        usePlugins: [plugin0],
      };

      manager.usePlugin(plugin1);

      await manager.init();

      expect(list).toStrictEqual([0]);
    });

    it('should allow to use function plugin', async () => {
      const manager = createAsyncManager<TestAsyncHooks>();

      const list: number[] = [];
      const plugin0: TestAsyncPlugin = {
        name: 'plugin0',
        setup: () => {
          list.push(0);
        },
      };

      manager.usePlugin(() => plugin0);

      await manager.init();

      expect(list).toStrictEqual([0]);
    });
  });
});
