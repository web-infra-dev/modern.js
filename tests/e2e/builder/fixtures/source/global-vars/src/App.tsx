import React from 'react';

if (ENABLE_TEST === true) {
  const test = document.createElement('div');
  test.id = 'test-el';
  test.innerHTML = 'aaaaa';
  document.body.appendChild(test);
}

const App = () => <div id="test">Hello Builder!</div>;

export default App;
