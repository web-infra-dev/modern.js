function newDecorator(value) {
  console.log('foo decorator');
}

class Foo {
  @newDecorator
  foo() {
    console.log('foo');
  }
}

console.log(new Foo());
