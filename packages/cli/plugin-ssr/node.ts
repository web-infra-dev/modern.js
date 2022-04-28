// TODO: 这个文件只是为了让 VS Code 里面解析如下代码的时候不报错，没有任何实质的意义
// 代码真正运行的时候：
// - 在源码模式已经通过 --conditions=jsnext:source 可以 resolve 到正确的文件了
// - 在编译之后的模式 package.json#exports 或者 package.json#main 也可以正确的 resolve 到对应的文件
export { default } from './src/index.node';
export * from './src/index.node';
