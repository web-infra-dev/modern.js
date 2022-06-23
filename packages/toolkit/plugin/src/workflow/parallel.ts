import { MaybeAsync, createPipeline, Middleware } from '../farrow-pipeline';
import type { AsyncWorker, AsyncWorkers } from './async';

const PARALLEL_WORKFLOW_SYMBOL = Symbol.for('MODERN_PARALLEL_WORKFLOW');

export type ParallelWorkflow<I, O = any> = {
  run: (input: I) => Promise<O[]>;
  use: (...I: AsyncWorkers<I, O>) => ParallelWorkflow<I, O>;
  [PARALLEL_WORKFLOW_SYMBOL]: true;
};

export const isParallelWorkflow = (
  input: any,
): input is ParallelWorkflow<any> => Boolean(input?.[PARALLEL_WORKFLOW_SYMBOL]);

export const createParallelWorkflow = <
  I = void,
  O = unknown,
>(): ParallelWorkflow<I, O> => {
  const pipeline = createPipeline<I, MaybeAsync<O>[]>();

  const use: ParallelWorkflow<I, O>['use'] = (...input) => {
    pipeline.use(...input.map(mapParallelWorkerToAsyncMiddleware));
    return workflow;
  };

  const run: ParallelWorkflow<I, O>['run'] = async input =>
    Promise.all(pipeline.run(input, { onLast: () => [] })).then(result =>
      result.filter(Boolean),
    );

  const workflow: ParallelWorkflow<I, O> = {
    ...pipeline,
    run,
    use,
    [PARALLEL_WORKFLOW_SYMBOL]: true as const,
  };

  return workflow;
};

const mapParallelWorkerToAsyncMiddleware =
  <I, O>(worker: AsyncWorker<I, O>): Middleware<I, MaybeAsync<O>[]> =>
  (input, next) =>
    [worker(input), ...next(input)];
