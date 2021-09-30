declare module '@babel/compat-data/native-modules' {
  const nativeModules: { 'es6.module': Record<string, string> };
  export default nativeModules;
}
