function decorator(value) {
  return function (target, property, descriptor) {
    const original = descriptor.value;

    descriptor.value = function (...args) {
      return original.apply(this, args) + value;
    };
    return descriptor;
  };
}

function readonly(target, property, descriptor = {}) {
  descriptor.writable = false;

  return descriptor;
}

class TestClass {
  @readonly
  message = 'hello';

  @decorator(' world')
  targetMethod() {
    return this.message;
  }
}

const instance = new TestClass();

// eslint-disable-next-line no-undef
window.aaa = instance.targetMethod();

try {
  instance.message = 'bbbb';
} catch (e) {
  // eslint-disable-next-line no-undef
  window.ccc = e.message;
}
