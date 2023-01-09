---
title: 数据模拟
sidebar_position: 6
---

Modern.js 提供了快速生成 Mock 数据的功能，能够让前端独立自主开发，不被后端接口阻塞。

## Mock 文件

约定当 `config/mock` 目录下存在 `index.[jt]s` 时，会自动开启 Mock 功能，如下：

```bash
.
├── config
│   └── mock
│       └── index.ts
├── src
│   └── App.tsx
└── modern.config.ts
```

## 编写 Mock 文件

`config/mock/index.ts` 文件只需要导出一个包含所有 Mock API 的对象，对象的属性由请求配置 `method` 和 `url` 组成，对应的属性值可以为 `Object`、`Array`、`Function`：

```js
module.exports = {
  /* 属性为具体的 method 和 请求 url，值为 object 或 array 作为请求的结果 */
  'GET /api/getInfo': { data: [1, 2, 3, 4] },

  /* method 默认为 GET */
  '/api/getExample': { id: 1 },

  /* 可以使用自定义函数根据请求动态返回数据，返回值参考 express middleware */
  'POST /api/addInfo': (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('200');
  },
};
```

代码中访问 `http://localhost:8080/api/getInfo` 时，接口会返回 JSON 格式数据：`{ "data": [1, 2, 3, 4] }`。

## 返回随机数据

可以在 `config/mock/index.js` 中自主引入 [Mock.js](https://github.com/nuysoft/Mock/wiki/Getting-Started) 等库生成随机数据，例如：

```js
const Mock = require('mockjs');

module.exports = {
  '/api/getInfo': Mock.mock({
    'data|1-10': [{ name: '@cname' }],
  }) /* => {data: [{name: "董霞"}, {name: "魏敏"},  {name: "石磊"}} */,
};
```

:::info 更多随机数据生成库

- [Chancejs](https://github.com/chancejs/chancejs)
- [Mock](https://github.com/nuysoft/Mock/wiki/Getting-Started)

:::

## 延迟返回

- 可以使用浏览器「 弱网模拟 」的功能实现。
- 可以通过 `setTimeout` 为单个接口设置延迟，例如：

```js
module.exports = {
  'api/getInfo': (req, res) => {
    setTimeout(() => {
      res.end('delay 2000ms');
    }, 2000);
  },
};
```
