import { createPipeline, Middleware } from '../farrow-pipeline';
import type { Worker, Workers } from './sync';

const SYNC_PARALLEL_WORKFLOW_SYMBOL = Symbol.for(
  'SYNC_MODERN_PARALLEL_WORKFLOW',
);

export type SyncParallelWorkflow<I, O = any> = {
  run: (input: I) => O[];
  use: (...I: Workers<I, O>) => SyncParallelWorkflow<I, O>;
  [SYNC_PARALLEL_WORKFLOW_SYMBOL]: true;
};

export const isSyncParallelWorkflow = (
  input: any,
): input is SyncParallelWorkflow<any> =>
  Boolean(input?.[SYNC_PARALLEL_WORKFLOW_SYMBOL]);

export const createSyncParallelWorkflow = <
  I = void,
  O = unknown,
>(): SyncParallelWorkflow<I, O> => {
  const pipeline = createPipeline<I, O[]>();

  const use: SyncParallelWorkflow<I, O>['use'] = (...input) => {
    pipeline.use(...input.map(mapSyncParallelWorkerToMiddleware));
    return workflow;
  };

  const run: SyncParallelWorkflow<I, O>['run'] = input => {
    return pipeline
      .run(input, { onLast: () => [] })
      .filter(result => Boolean(result));
  };

  const workflow: SyncParallelWorkflow<I, O> = {
    ...pipeline,
    run,
    use,
    [SYNC_PARALLEL_WORKFLOW_SYMBOL]: true as const,
  };

  return workflow;
};

const mapSyncParallelWorkerToMiddleware =
  <I, O>(worker: Worker<I, O>): Middleware<I, O[]> =>
  (input, next) =>
    [worker(input), ...next(input)];
