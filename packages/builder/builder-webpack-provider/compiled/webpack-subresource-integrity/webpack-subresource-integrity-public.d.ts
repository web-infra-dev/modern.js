import type { Compiler } from '../webpack';

/**
 * The webpack-subresource-integrity plugin.
 *
 * @public
 */
export declare class SubresourceIntegrityPlugin {
    private readonly options;
    /**
     * Create a new instance.
     *
     * @public
     */
    constructor(options?: SubresourceIntegrityPluginOptions);







    apply(compiler: Compiler): void;
}

/**
 * @public
 */
export declare interface SubresourceIntegrityPluginOptions {
    readonly hashFuncNames?: [string, ...string[]];
    readonly enabled?: "auto" | true | false;
    readonly hashLoading?: "eager" | "lazy";
}

export { }
