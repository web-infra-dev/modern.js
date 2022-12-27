---
title: index.[tj]s
sidebar_position: 4
---

Entry identifier if App want use custom entry. In most case, [`App.[tj]sx`](/docs/apis/app/hooks/src/app) hook file can already meet our needs.

When we need to add custom behavior before `bootstrap` or completely take over the webpack entry, we can place `index.[tj]s` in `src/` or entry directory. The following are discussed in two cases:


1. add custom behavior before bootstrap

Just add default export under `src/index.[tj]s`:

```js title=src/index.js
import { bootstrap } from '@modern-js/runtime';

export default App => {
  // do something before bootstrap...
  bootstrap(App, 'root');
};
```

2. Fully take over the webpack entry

When there is no default export function under `src/index.[tj]sx?`, this file is the real webpack entry file, and the code can be organized such as create-react-app:

```js title=src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```
