/// <reference types="node" />
import type * as scandir from '../../../fs.scandir/out/index.js';
export declare type Entry = scandir.Entry;
export declare type Errno = NodeJS.ErrnoException;
export interface QueueItem {
    directory: string;
    base?: string;
}
