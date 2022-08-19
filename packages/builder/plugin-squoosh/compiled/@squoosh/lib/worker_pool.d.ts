/// <reference types="node" />
import { Worker } from 'worker_threads';
import { TransformStream } from 'web-streams-polyfill';
interface Job<I> {
    msg: I;
    resolve: Function;
    reject: Function;
}
export default class WorkerPool<I, O> {
    numWorkers: number;
    jobQueue: TransformStream<Job<I>, Job<I>>;
    workerQueue: TransformStream<Worker, Worker>;
    done: Promise<void>;
    constructor(numWorkers: number, workerFile: string);
    _readLoop(): Promise<void>;
    _nextWorker(): Promise<Worker>;
    _terminateAll(): Promise<void>;
    join(): Promise<void>;
    dispatchJob(msg: I): Promise<O>;
    private jobPromise;
    static useThisThreadAsWorker<I, O>(cb: (msg: I) => O): void;
}
export {};
//# sourceMappingURL=worker_pool.d.ts.map