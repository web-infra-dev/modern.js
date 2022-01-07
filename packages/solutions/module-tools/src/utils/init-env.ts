interface ITaskConfig {
  srcRootDir: string; // 源码的根目录
  willCompilerDirOrFile: string; // 用于编译的源码文件或者源码目录
  distDir: string;
  appDirectory: string;
  sourceMaps: boolean;
  syntax: 'es5' | 'es6+';
  type: 'module' | 'commonjs';
  tsconfigPath: string;
  copyDirs?: string;
  compiler?: 'babel' | 'esbuild' | 'swc';
  watch: boolean;
}

export const initEnv = ({
  syntax,
  type,
}: {
  syntax: ITaskConfig['syntax'];
  type: ITaskConfig['type'];
}) => {
  if (syntax === 'es6+' && type === 'commonjs') {
    return 'CJS_ES6';
  } else if (syntax === 'es6+' && type === 'module') {
    return 'ESM_ES6';
  } else if (syntax === 'es5' && type === 'module') {
    return 'ESM_ES5';
  }

  return '';
};
