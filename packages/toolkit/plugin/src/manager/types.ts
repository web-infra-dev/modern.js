import type {
  Middleware,
  Pipeline,
  AsyncPipeline,
  MaybeAsync,
} from 'farrow-pipeline';
import type {
  Waterfall,
  Brook,
  AsyncWaterfall,
  AsyncBrook,
} from '../waterfall';
import type {
  Worker,
  Workflow,
  AsyncWorker,
  AsyncWorkflow,
  ParallelWorkflow,
} from '../workflow';

export type Hook =
  | Waterfall<any>
  | AsyncWaterfall<any>
  | Workflow<any, any>
  | AsyncWorkflow<any, any>
  | ParallelWorkflow<any>
  | Pipeline<any, any>
  | AsyncPipeline<any, any>;

export type HooksMap = Record<string, Hook>;

export type HookToThread<P extends Hook> = P extends Workflow<infer I, infer O>
  ? Worker<I, O>
  : P extends AsyncWorkflow<infer I, infer O>
  ? AsyncWorker<I, O>
  : P extends ParallelWorkflow<infer I, infer O>
  ? AsyncWorker<I, O>
  : P extends Waterfall<infer I>
  ? Brook<I>
  : P extends AsyncWaterfall<infer I>
  ? AsyncBrook<I>
  : P extends Pipeline<infer I, infer O>
  ? Middleware<I, O>
  : P extends AsyncPipeline<infer I, infer O>
  ? Middleware<I, MaybeAsync<O>>
  : never;

export type HooksToThreads<PS extends HooksMap | void> = {
  [K in keyof PS]: PS[K] extends Hook
    ? HookToThread<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

export type RunnerFromProgress<P extends Hook> = P extends Waterfall<infer I>
  ? Waterfall<I>['run']
  : P extends AsyncWaterfall<infer I>
  ? AsyncWaterfall<I>['run']
  : P extends Workflow<infer I, infer O>
  ? Workflow<I, O>['run']
  : P extends AsyncWorkflow<infer I, infer O>
  ? AsyncWorkflow<I, O>['run']
  : P extends ParallelWorkflow<infer I, infer O>
  ? ParallelWorkflow<I, O>['run']
  : P extends Pipeline<infer I, infer O>
  ? Pipeline<I, O>['run']
  : P extends AsyncPipeline<infer I, infer O>
  ? AsyncPipeline<I, O>['run']
  : never;

export type HooksToRunners<PS extends HooksMap | void> = {
  [K in keyof PS]: PS[K] extends Hook
    ? RunnerFromProgress<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

export type PluginOptions = {
  name?: string;
  pre?: string[];
  post?: string[];
  rivals?: string[];
  required?: string[];
};
