import React from 'react';
import { content } from '@/common/test';

if (ENABLE_TEST === true) {
  const test = document.createElement('div');
  test.id = 'test-el';
  test.innerHTML = 'aaaaa';
  document.body.appendChild(test);
}

const testAliasEl = document.createElement('div');
testAliasEl.id = 'test-alias-el';
testAliasEl.innerHTML = content;
document.body.appendChild(testAliasEl);

const App = () => <div id="test">Hello Builder!</div>;

export default App;
