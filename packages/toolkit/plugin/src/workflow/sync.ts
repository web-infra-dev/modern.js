import { createPipeline, Middleware } from '../farrow-pipeline';

const WORKFLOW_SYMBOL = Symbol.for('MODERN_WORKFLOW');

export type Worker<I, O> = (I: I) => O;
export type Workers<I, O> = Worker<I, O>[];

export type Workflow<I, O> = {
  run: (input: I) => void;
  use: (...I: Workers<I, O>) => Workflow<I, O>;
  [WORKFLOW_SYMBOL]: true;
};

export const createWorkflow = <I = void, O = unknown>(): Workflow<I, O> => {
  const pipeline = createPipeline<I, O[]>();

  const use: Workflow<I, O>['use'] = (...input) => {
    pipeline.use(...input.map(mapWorkerToMiddleware));
    return workflow;
  };

  const run: Workflow<I, O>['run'] = input => {
    const result = pipeline.run(input, { onLast: () => [] });
    return result.filter(Boolean);
  };

  const workflow: Workflow<I, O> = {
    ...pipeline,
    use,
    run,
    [WORKFLOW_SYMBOL]: true as const,
  };

  return workflow;
};

export const isWorkflow = (input: any): input is Workflow<unknown, unknown> =>
  Boolean(input?.[WORKFLOW_SYMBOL]);

const mapWorkerToMiddleware =
  <I, O>(worker: Worker<I, O>): Middleware<I, O[]> =>
  (input, next) =>
    [worker(input), ...next(input)];
