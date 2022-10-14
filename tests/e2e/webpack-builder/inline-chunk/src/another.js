import './style.css';

import(
  /* webpackChunkName: "foo" */
  './foo'
).then(({ foo }) => {
  window.answer = 'another ' + foo();
});
