import type { Merge } from 'type-fest';

export type Merge3<A, B, C> = Merge<A, Merge<B, C>>;
