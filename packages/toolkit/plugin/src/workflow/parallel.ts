import { MaybeAsync, createPipeline, Middleware } from '../farrow-pipeline';
import type { AsyncWorker, AsyncWorkers } from './async';
import type { RunWorkflowOptions } from './sync';

const PARALLEL_WORKFLOW_SYMBOL = Symbol.for('MODERN_PARALLEL_WORKFLOW');

export type ParallelWorkflow<I, O = any> = {
  run: (input: I, options?: RunWorkflowOptions) => Promise<O[]>;
  use: (...I: AsyncWorkers<I, O>) => ParallelWorkflow<I, O>;
  [PARALLEL_WORKFLOW_SYMBOL]: true;
};

export type ParallelWorkflow2Worker<W extends ParallelWorkflow<any>> =
  W extends ParallelWorkflow<infer CS, infer O> ? AsyncWorker<CS, O> : never;

export type ParallelWorkflowRecord = Record<string, ParallelWorkflow<any>>;

export type ParallelWorkflows2Workers<
  PS extends ParallelWorkflowRecord | void,
> = {
  [K in keyof PS]: PS[K] extends ParallelWorkflow<any>
    ? ParallelWorkflow2Worker<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

export type ParallelWorkflows2AsyncWorkers<
  PS extends ParallelWorkflowRecord | void,
> = {
  [K in keyof PS]: PS[K] extends ParallelWorkflow<any>
    ? ParallelWorkflow2Worker<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

export type RunnerFromParallelWorkflow<W extends ParallelWorkflow<any>> =
  W extends ParallelWorkflow<infer CS, infer O>
    ? ParallelWorkflow<CS, O>['run']
    : never;

export type ParallelWorkflows2Runners<
  PS extends ParallelWorkflowRecord | void,
> = {
  [K in keyof PS]: PS[K] extends ParallelWorkflow<any>
    ? RunnerFromParallelWorkflow<PS[K]>
    : PS[K] extends void
    ? void
    : never;
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

  const run: ParallelWorkflow<I, O>['run'] = async (input, options) =>
    Promise.all(pipeline.run(input, { ...options, onLast: () => [] })).then(
      result => result.filter(Boolean),
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
