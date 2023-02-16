import './style.css';

import(
  /* webpackChunkName: "foo" */
  './foo'
).then(({ foo }) => {
  // eslint-disable-next-line no-undef
  window.answer = foo();
});
