function logged() {
  // eslint-disable-next-line no-undef
  window.bbb = 'world';
  console.log('hhhhh');
}

class C {
  message = 'hello!';

  @logged
  m() {
    return this.message;
  }
}

// eslint-disable-next-line no-undef
window.aaa = new C().m();
