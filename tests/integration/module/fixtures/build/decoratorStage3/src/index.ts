function decoratedMethod<This, Args extends any[]>(
  target: (this: This, ...args: Args) => string,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => string
  >,
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): string {
    const result = target.call(this, ...args);
    return `modern.js user ${result} is calling ${methodName}!`;
  }

  return replacementMethod;
}

export class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @decoratedMethod
  describe() {
    return this.name;
  }
}
