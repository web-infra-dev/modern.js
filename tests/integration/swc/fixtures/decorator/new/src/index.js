function newDecorator(value) {
  console.log('foo decorator');
  return value;
}

class Foo {
  @newDecorator
  foo() {
    console.log('foo');
  }
}

console.log(new Foo());
