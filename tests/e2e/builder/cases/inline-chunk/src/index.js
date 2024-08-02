import './style.css';

window.test = 'aaaa';

import(
  /* webpackChunkName: "foo" */
  './foo'
).then(({ foo }) => {
  window.answer = foo();
});
