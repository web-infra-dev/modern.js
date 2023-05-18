import './style.css';

// eslint-disable-next-line no-undef
window.test = 'aaaa';

import(
  /* webpackChunkName: "foo" */
  './foo'
).then(({ foo }) => {
  // eslint-disable-next-line no-undef
  window.answer = foo();
});
