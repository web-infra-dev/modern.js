import type {
  Pipeline,
  MaybeAsync,
  Middleware,
  AsyncPipeline,
} from '../farrow-pipeline';
import type {
  Brook,
  Waterfall,
  AsyncBrook,
  AsyncWaterfall,
} from '../waterfall';
import type {
  Worker,
  Workflow,
  AsyncWorker,
  AsyncWorkflow,
  ParallelWorkflow,
  AsyncInterruptWorkflow,
  AsyncInterruptWorker,
  SyncParallelWorkflow,
} from '../workflow';

/** All hook types. */
export type Hook =
  | Waterfall<any>
  | AsyncWaterfall<any>
  | Workflow<any, any>
  | AsyncWorkflow<any, any>
  | ParallelWorkflow<any>
  | SyncParallelWorkflow<any>
  | Pipeline<any, any>
  | AsyncPipeline<any, any>
  | AsyncInterruptWorkflow<any, any>;

export type HooksMap = Record<string, Hook>;

/** Extract the type of callback function from a hook. */
export type ToThread<P extends Hook> = P extends Workflow<infer I, infer O>
  ? Worker<I, O>
  : P extends AsyncWorkflow<infer I, infer O>
  ? AsyncWorker<I, O>
  : P extends ParallelWorkflow<infer I, infer O>
  ? AsyncWorker<I, O>
  : P extends SyncParallelWorkflow<infer I, infer O>
  ? Worker<I, O>
  : P extends Waterfall<infer I>
  ? Brook<I>
  : P extends AsyncWaterfall<infer I>
  ? AsyncBrook<I>
  : P extends Pipeline<infer I, infer O>
  ? Middleware<I, O>
  : P extends AsyncPipeline<infer I, infer O>
  ? Middleware<I, MaybeAsync<O>>
  : P extends AsyncInterruptWorkflow<infer I, infer O>
  ? AsyncInterruptWorker<I, O>
  : never;

/** Extract types of callback function from hooks. */
export type ToThreads<PS> = {
  [K in keyof PS]: PS[K] extends Hook
    ? ToThread<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

/** Extract run method from a hook. */
export type RunnerFromHook<P extends Hook> = P extends Waterfall<infer I>
  ? Waterfall<I>['run']
  : P extends AsyncWaterfall<infer I>
  ? AsyncWaterfall<I>['run']
  : P extends Workflow<infer I, infer O>
  ? Workflow<I, O>['run']
  : P extends AsyncWorkflow<infer I, infer O>
  ? AsyncWorkflow<I, O>['run']
  : P extends ParallelWorkflow<infer I, infer O>
  ? ParallelWorkflow<I, O>['run']
  : P extends SyncParallelWorkflow<infer I, infer O>
  ? SyncParallelWorkflow<I, O>['run']
  : P extends Pipeline<infer I, infer O>
  ? Pipeline<I, O>['run']
  : P extends AsyncPipeline<infer I, infer O>
  ? AsyncPipeline<I, O>['run']
  : P extends AsyncInterruptWorkflow<infer I, infer O>
  ? AsyncInterruptWorkflow<I, O>['run']
  : never;

/** Extract all run methods from hooks. */
export type ToRunners<PS> = {
  [K in keyof PS]: PS[K] extends Hook
    ? RunnerFromHook<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

/** All options to define a plugin. */
export type PluginOptions<
  Hooks,
  Setup = undefined,
  ExtendHooks = Record<string, unknown>,
> = {
  name?: string;
  pre?: string[];
  post?: string[];
  setup?: Setup;
  rivals?: string[];
  required?: string[];
  usePlugins?: PluginOptions<any, any>[];
  registerHook?: Partial<Hooks & ExtendHooks>;
};

/** Common api of setup function. */
export type CommonAPI<Hooks> = {
  useHookRunners: () => ToRunners<Hooks>;
};
