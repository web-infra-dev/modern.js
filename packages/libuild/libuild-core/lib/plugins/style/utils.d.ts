/// <reference types="node" />
export declare function getHash(content: Buffer | string, encoding: any, type?: string): string;
/**
 * make sure load processor in user project root other than root
 * @param lang
 * @param root
 * @returns
 */
export declare function loadProcessor(lang: string, root: string, implementation?: object | string): any;
type CssUrlReplacer = (url: string, importer?: string) => string | Promise<string>;
/**
 * relative url() inside \@imported sass and less files must be rebased to use
 * root file as base.
 */
export declare function rebaseUrls(file: string, rootDir: string, resolver: (id: string, dir: string) => string): Promise<{
    file: string;
    contents?: string;
}>;
export declare function rewriteCssUrls(css: string, type: false | string, replacer: CssUrlReplacer): Promise<string>;
export {};
//# sourceMappingURL=utils.d.ts.map