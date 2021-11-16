import { Container, createPipeline, Middleware } from 'farrow-pipeline';

const WORKFLOW_SYMBOL = Symbol('WORKFLOW_SYMBOL');

export type Worker<I, O> = (I: I) => O;
export type Workers<I, O> = Worker<I, O>[];

export type RunWorkflowOptions = {
  container?: Container;
};

export type Workflow<I, O> = {
  run: (input: I, options?: RunWorkflowOptions) => void;
  use: (...I: Workers<I, O>) => Workflow<I, O>;
  [WORKFLOW_SYMBOL]: true;
};

export type Workflow2Worker<W extends Workflow<any, any>> = W extends Workflow<
  infer I,
  infer O
>
  ? Worker<I, O>
  : never;

export type WorkflowRecord = Record<string, Workflow<any, any>>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Workflows2Workers<PS extends WorkflowRecord | void> = {
  [K in keyof PS]: PS[K] extends Workflow<any, any>
    ? Workflow2Worker<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export type RunnerFromWorkflow<W extends Workflow<any, any>> =
  W extends Workflow<infer I, infer O> ? Workflow<I, O>['run'] : never;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Workflows2Runners<PS extends WorkflowRecord | void> = {
  [K in keyof PS]: PS[K] extends Workflow<any, any>
    ? RunnerFromWorkflow<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export const createWorkflow = <I = void, O = unknown>(): Workflow<I, O> => {
  const pipeline = createPipeline<I, O[]>();

  const use: Workflow<I, O>['use'] = (...input) => {
    pipeline.use(...input.map(mapWorkerToMiddleware));
    return workflow;
  };

  const run: Workflow<I, O>['run'] = async (input, options) => {
    const result = pipeline.run(input, { ...options, onLast: () => [] });
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
