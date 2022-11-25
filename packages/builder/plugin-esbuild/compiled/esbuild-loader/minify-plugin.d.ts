import webpack from 'webpack';
import { MinifyPluginOptions } from './interfaces';
declare class ESBuildMinifyPlugin {
    private readonly options;
    private readonly transform;
    constructor(options?: MinifyPluginOptions);
    apply(compiler: webpack.Compiler): void;
    private transformAssets;
}
export default ESBuildMinifyPlugin;
