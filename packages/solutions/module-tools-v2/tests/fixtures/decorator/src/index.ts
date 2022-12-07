function enhancer(name: string) {
  return function enhancer(target: any) {
    target.prototype.name = name;
  };
}
@enhancer('module-tools') // 在使用装饰器的时候, 为其指定元数据
export class Person {
  version: string;

  constructor() {
    this.version = '1.0.0';
  }
}
