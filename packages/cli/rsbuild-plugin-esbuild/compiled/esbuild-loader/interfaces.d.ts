import { transform, TransformOptions } from 'esbuild';
type Filter = string | RegExp;
type Implementation = {
    transform: typeof transform;
};
type Except<ObjectType, Properties> = {
    [Key in keyof ObjectType as (Key extends Properties ? never : Key)]: ObjectType[Key];
};
type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'> & {
    /** Pass a custom esbuild implementation */
    implementation?: Implementation;
};
type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & {
    include?: Filter | Filter[];
    exclude?: Filter | Filter[];
    css?: boolean;
    /** Pass a custom esbuild implementation */
    implementation?: Implementation;
};
export { LoaderOptions, MinifyPluginOptions, };
