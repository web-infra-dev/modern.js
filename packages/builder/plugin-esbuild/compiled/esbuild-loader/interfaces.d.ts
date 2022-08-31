import { transform, TransformOptions } from 'esbuild';
declare type Filter = string | RegExp;
declare type Implementation = {
    transform: typeof transform;
};
declare type Except<ObjectType, Properties> = {
    [Key in keyof ObjectType as (Key extends Properties ? never : Key)]: ObjectType[Key];
};
declare type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'> & {
    /** Pass a custom esbuild implementation */
    implementation?: Implementation;
};
declare type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & {
    include?: Filter | Filter[];
    exclude?: Filter | Filter[];
    css?: boolean;
    /** Pass a custom esbuild implementation */
    implementation?: Implementation;
};
export { LoaderOptions, MinifyPluginOptions, };
