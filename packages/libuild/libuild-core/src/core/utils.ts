import * as tapable from 'tapable';
import { promisify } from 'util';
import { Source, ILibuilder, Chunk } from '../types';

export function createTransformHook(compiler: ILibuilder) {
  const hook = new tapable.AsyncSeriesWaterfallHook<Source>(['args']);

  if (!compiler.config.transformCache) {
    return hook;
  }

  const originTapPromise = hook.tapPromise;

  let hook_fn_id = 1;
  // @ts-ignore
  const cacheFn = (options, fn) => {
    fn.id = hook_fn_id++;
    originTapPromise.call(hook, options, async (args) => {
      const originCode = args.code;
      const { id } = fn;
      const context = compiler.getTransformContext(args.path);
      const cache = context.getValidCache(id, args.code);
      if (cache) {
        return cache;
      }
      delete args.map;
      const result = await fn(args);
      context.addTransformResult(id, {
        ...result,
        originCode,
      });
      return result;
    });
  };
  hook.tap = cacheFn;
  hook.tapPromise = cacheFn;

  // @ts-ignore
  hook.tapAsync = function (options, fn) {
    cacheFn(options, promisify(fn));
  };

  return hook;
}

export function createProcessAssetHook(compiler: ILibuilder) {
  const hook = new tapable.AsyncSeriesWaterfallHook<Chunk>(['chunk']);

  if (!compiler.config.sourceMap) return hook;

  const originTapPromise = hook.tapPromise;

  let hook_fn_id = 1;
  // @ts-ignore
  const wrapper = (options, fn) => {
    fn.id = hook_fn_id++;
    originTapPromise.call(hook, options, async (chunk) => {
      const context = compiler.getSourcemapContext(chunk.fileName);

      if (chunk.type === 'chunk') {
        delete chunk.map;
      }
      const result = await fn(chunk);

      if (chunk.type === 'chunk') {
        // @ts-ignore
        context.addSourceMap(fn.id, result.map);
      }
      return result;
    });
  };
  hook.tap = wrapper;
  hook.tapPromise = wrapper;

  // @ts-ignore
  hook.tapAsync = function (options, fn) {
    wrapper(options, promisify(fn));
  };

  return hook;
}
