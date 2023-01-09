---
title: Mock
sidebar_position: 6
---

Modern.js provides the ability to quickly generate Mock data, allowing the front-end to develop independently without being blocked by the back-end interface.

## Mock File

By convention, when there is `index.[jt]s` in the `config/mock/` directory, the Mock Data will be automatically enabled, as follows:

```bash
.
├── config
│   └── mock
│       └── index.ts
├── src
│   └── App.tsx
└── modern.config.ts
```

## Writing Mock Files

the `config/mock/index.ts` file only needs to export an object containing all Mock APIs. The properties of the object are composed of the request configuration `method` and `url`, and the corresponding property values can be `Object`, `Array`, `Function`:

```js
export default {
  /* The attribute is the concrete method and request url, and the value is object or array as the result of the request */
  'GET /api/getInfo': { data: [1, 2, 3, 4] },

  /* the default method is GET */
  '/api/getExample': { id: 1 },

  /* You can use custom functions to dynamically return data */
  'POST /api/addInfo': (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('200');
  },
};
```

when access `http://localhost:8080/api/getInfo`, the api will return json `{ "data": [1, 2, 3, 4] }`。

## Return Random Data

Libraries such as [Mock.js](https://github.com/nuysoft/Mock/wiki/Getting-Started) can be used in `config/mock/index.js` to generate random data, for example:

```js
const Mock = require('mockjs');

module.exports = {
  '/api/getInfo': Mock.mock({
    'data|1-10': [{ name: '@cname' }],
  }) /* => {data: [{name: "董霞"}, {name: "魏敏"},  {name: "石磊"}} */,
};
```

:::info Other Mock Lib

- [Chancejs](https://github.com/chancejs/chancejs)
- [Mock](https://github.com/nuysoft/Mock/wiki/Getting-Started)

:::

## Delayed Return

- It can be achieved using the function of the browser "weak connection simulation".
- Delays can be set via `setTimeout`, for example:

```ts
export default {
  'api/getInfo': (req, res) => {
    setTimeout(() => {
      res.end('delay 2000ms');
    }, 2000);
  },
};
```
