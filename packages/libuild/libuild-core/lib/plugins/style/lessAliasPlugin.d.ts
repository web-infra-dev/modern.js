interface Options {
    config: any;
    stdinDir: string;
}
export default class LessAliasesPlugin {
    config: any;
    stdinDir: string;
    constructor(options: Options);
    install(less: any, pluginManager: any): void;
}
export {};
//# sourceMappingURL=lessAliasPlugin.d.ts.map