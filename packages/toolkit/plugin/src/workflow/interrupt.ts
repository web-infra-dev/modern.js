import {
  MaybeAsync,
  Middleware,
  createAsyncPipeline,
} from '../farrow-pipeline';

const ASYNC_INTERRUPT_WORKFLOW_SYMBOL = Symbol.for(
  'ASYNC_INTERRUPT_WORKFLOW_SYMBOL',
);

export type AsyncInterruptWorker<I, O> = (
  I: I,
  interrupt: (result: any) => void,
) => MaybeAsync<O>;
export type AsyncInterruptWorkers<I, O> = AsyncInterruptWorker<I, O>[];

export type AsyncInterruptWorkflow<I, O> = {
  run: (input: I) => MaybeAsync<O[]>;
  use: (...I: AsyncInterruptWorkers<I, O>) => AsyncInterruptWorkflow<I, O>;
  [ASYNC_INTERRUPT_WORKFLOW_SYMBOL]: true;
};

export const isAsyncInterruptWorkflow = (
  input: any,
): input is AsyncInterruptWorkflow<any, any> =>
  Boolean(input?.[ASYNC_INTERRUPT_WORKFLOW_SYMBOL]);

export const createAsyncInterruptWorkflow = <
  I = void,
  O = unknown,
>(): AsyncInterruptWorkflow<I, O> => {
  const pipeline = createAsyncPipeline<I, O[]>();
  const use: AsyncInterruptWorkflow<I, O>['use'] = (...input) => {
    pipeline.use(...(input.map(mapAsyncWorkerToInterruptMiddleware) as any));
    return workflow;
  };
  const run: AsyncInterruptWorkflow<I, O>['run'] = async input => {
    const result = await pipeline.run(input, { onLast: () => [] });
    return result;
  };
  const workflow: AsyncInterruptWorkflow<I, O> = {
    ...pipeline,
    use,
    run,
    [ASYNC_INTERRUPT_WORKFLOW_SYMBOL]: true as const,
  };
  return workflow;
};

const mapAsyncWorkerToInterruptMiddleware =
  <I, O>(
    worker: AsyncInterruptWorker<I, O>,
  ): Middleware<I, MaybeAsync<O[] | unknown>> =>
  async (input, next) => {
    let isInterrupted = false;
    const interrupt = (value: O) => {
      isInterrupted = true;
      return value;
    };
    const result = await Promise.resolve(worker(input, interrupt));
    if (isInterrupted) {
      return result;
    }
    return Promise.resolve(next(input));
  };
