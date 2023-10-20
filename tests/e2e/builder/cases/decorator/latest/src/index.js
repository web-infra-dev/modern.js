// only have one param
function readonly(elementDescriptor) {
  elementDescriptor.descriptor.writable = false;

  return elementDescriptor;
}

function decorator(value) {
  return function (elementDescriptor) {
    const original = elementDescriptor.descriptor.value;

    elementDescriptor.descriptor.value = function (...args) {
      return original.apply(this, args) + value;
    };

    return elementDescriptor;
  };
}

class TestClass {
  @readonly
  message = 'hello';

  @decorator(' world')
  targetMethod() {
    return this.message;
  }

  update() {
    try {
      this.message = 'aaaa';
    } catch (e) {
      // eslint-disable-next-line no-undef
      window.bbb = e.message;
    }
  }
}

const instance = new TestClass();

// eslint-disable-next-line no-undef
window.aaa = instance.targetMethod();

instance.update();

try {
  instance.message = 'bbbb';
} catch (e) {
  // eslint-disable-next-line no-undef
  window.ccc = e.message;
}
