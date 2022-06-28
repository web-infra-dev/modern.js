## 入口名称

默认情况下，「入口名称」为页面入口所在目录的名称。

例如，项目的目录结构如下时，入口名称为 `page-a` 和 `page-b`。

```
└── src
    ├── page-a
    │   └── App.jsx
    └── page-b
        └── App.jsx
```

如果使用 [source.entries](/docs/apis/config/source/entries) 自定义了页面入口，则「入口名称」为 `source.entries` 对象的 `key`。
