import type { ParseReturnFiltered } from '../../dependencies/minimatch/dist/commonjs/index.js';
import { GLOBSTAR } from '../../dependencies/minimatch/dist/commonjs/index.js';
/**
 * One portion of a parsed minimatch pattern: a string, a Matcher for
 * a portion with magic, or GLOBSTAR for `**`.
 */
export type MMPattern = ParseReturnFiltered;
/** The Matcher that minimatch makes for a portion with magic. */
export type MMMatcher = Exclude<MMPattern, string | typeof GLOBSTAR>;
export type PatternList = [p: MMPattern, ...rest: MMPattern[]];
export type UNCPatternList = [
    p0: '',
    p1: '',
    p2: string,
    p3: string,
    ...rest: MMPattern[]
];
export type DrivePatternList = [p0: string, ...rest: MMPattern[]];
export type AbsolutePatternList = [p0: '', ...rest: MMPattern[]];
export type GlobList = [p: string, ...rest: string[]];
declare const customInspect: unique symbol;
/**
 * An immutable-ish view on an array of glob parts and their parsed
 * results
 */
export declare class Pattern {
    #private;
    readonly length: number;
    constructor(patternList: MMPattern[], globList: string[], index: number, platform: NodeJS.Platform);
    [customInspect](): string;
    /**
     * The first entry in the parsed list of patterns
     */
    pattern(): MMPattern;
    /**
     * true of if pattern() returns a string
     */
    isString(): boolean;
    /**
     * true of if pattern() returns GLOBSTAR
     */
    isGlobstar(): boolean;
    /**
     * true if pattern() returns a Matcher, for a portion with magic
     */
    isMatcher(): boolean;
    /**
     * The /-joined set of glob parts that make up this pattern
     */
    globString(): string;
    /**
     * true if there are more pattern parts after this one
     */
    hasMore(): boolean;
    /**
     * The rest of the pattern after this part, or null if this is the end
     */
    rest(): Pattern | null;
    /**
     * true if the pattern represents a //unc/path/ on windows
     */
    isUNC(): boolean;
    /**
     * True if the pattern starts with a drive letter on Windows
     */
    isDrive(): boolean;
    /**
     * True if the pattern is rooted on an absolute path
     */
    isAbsolute(): boolean;
    /**
     * consume the root of the pattern, and return it
     */
    root(): string;
    /**
     * Check to see if the current globstar pattern is allowed to follow
     * a symbolic link.
     */
    checkFollowGlobstar(): boolean;
    /**
     * Mark that the current globstar pattern is following a symbolic link
     */
    markFollowGlobstar(): boolean;
}
export {};
