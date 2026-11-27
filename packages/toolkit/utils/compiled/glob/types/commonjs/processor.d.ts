import type { Path } from '../../dependencies/path-scurry/dist/commonjs/index.js';
import type { MMMatcher, Pattern } from './pattern.js';
import type { GlobWalkerOpts } from './walker.js';
/**
 * A cache of which patterns have been processed for a given Path, in
 * this walk step and the steps that led to it.
 *
 * A step only adds to it before it makes the caches for the next
 * steps, so a copy can look up the chain of caches before it, in
 * place of copying their entries. A pattern for a path that a cache
 * up the chain has already seen is added to that cache's set, so that
 * the other steps that share it see it too. Paths are keyed by their
 * full path, because path-scurry can make a new Path object for the
 * same path once its cache of children is full.
 */
export declare class HasWalkedCache {
    #private;
    parent?: HasWalkedCache;
    store?: Map<string, Set<string>>;
    constructor(parent?: HasWalkedCache);
    copy(): HasWalkedCache;
    hasWalked(target: Path, pattern: Pattern): boolean;
    storeWalked(target: Path, pattern: Pattern): void;
}
/**
 * A record of which paths have been matched in a given walk step,
 * and whether they only are considered a match if they are a directory,
 * and whether their absolute or relative path should be returned.
 * The store maps each path to {@link MatchRecord.ABSOLUTE} and
 * {@link MatchRecord.IF_DIR} flags.
 */
export declare class MatchRecord {
    static readonly ABSOLUTE = 2;
    static readonly IF_DIR = 1;
    store: Map<Path, number>;
    add(target: Path, absolute: boolean, ifDir: boolean): void;
}
/**
 * A collection of patterns that must be processed in a subsequent step
 * for a given path.
 */
export declare class SubWalks {
    store: Map<Path, Pattern[]>;
    add(target: Path, pattern: Pattern): void;
    get(target: Path): Pattern[];
    entries(): [Path, Pattern[]][];
    keys(): Path[];
}
/**
 * The class that processes patterns for a given path.
 *
 * Handles child entry filtering, and determining whether a path's
 * directory contents must be read.
 */
export declare class Processor {
    hasWalkedCache: HasWalkedCache;
    matches: MatchRecord;
    subwalks: SubWalks;
    patterns?: Pattern[];
    follow: boolean;
    dot: boolean;
    opts: GlobWalkerOpts;
    constructor(opts: GlobWalkerOpts, hasWalkedCache?: HasWalkedCache);
    processPatterns(target: Path, patterns: Pattern[]): this;
    subwalkTargets(): Path[];
    child(): Processor;
    filterEntries(parent: Path, entries: Path[]): Processor;
    testGlobstar(e: Path, pattern: Pattern, rest: Pattern | null, absolute: boolean): void;
    testMatcher(e: Path, p: MMMatcher, rest: Pattern | null, absolute: boolean): void;
    testString(e: Path, p: string, rest: Pattern | null, absolute: boolean): void;
}
