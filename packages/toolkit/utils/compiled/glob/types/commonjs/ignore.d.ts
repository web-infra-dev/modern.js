import type { MinimatchOptions } from '../../dependencies/minimatch/dist/commonjs/index.js';
import { Minimatch } from '../../dependencies/minimatch/dist/commonjs/index.js';
import type { Path } from '../../dependencies/path-scurry/dist/commonjs/index.js';
import type { GlobWalkerOpts } from './walker.js';
export interface IgnoreLike {
    ignored?: (p: Path) => boolean;
    childrenIgnored?: (p: Path) => boolean;
    add?: (ignore: string) => void;
}
/**
 * Class used to process ignored patterns
 */
export declare class Ignore implements IgnoreLike {
    relative: Minimatch[];
    relativeChildren: Minimatch[];
    absolute: Minimatch[];
    absoluteChildren: Minimatch[];
    platform: NodeJS.Platform;
    mmopts: MinimatchOptions;
    /**
     * The escaped glob for the directory that a pattern starting with
     * `/` is rooted at, with no trailing `/`.
     */
    slashRoot: string;
    /**
     * Patterns that start with `/` (but not drive letters or UNC paths
     * on Windows) start at the `root` option if it is set, or else at
     * the root of `cwd`, the same as non-ignored patterns. If `cwd` is
     * not provided, they start at `/`.
     */
    constructor(ignored: string[], { nobrace, nocase, noext, noglobstar, normalize, platform, root, windowsPathsNoEscape, allowWindowsEscape, braceExpandMax, }: GlobWalkerOpts, cwd?: Path);
    add(ign: string): void;
    ignored(p: Path): boolean;
    childrenIgnored(p: Path): boolean;
}
