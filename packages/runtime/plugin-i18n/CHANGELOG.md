# @modern-js/plugin-i18n

## 3.11.3

### Patch Changes

- 75631e4: fix(plugin-i18n): bundle the runtime's react-i18next import eagerly so it no longer adds an async chunk request before the first render.

  fix(plugin-i18n): 运行时对 react-i18next 的动态引入改为打进当前 chunk，首屏渲染前不再多请求一个异步 chunk。

- 6e86aac: fix(plugin-i18n): register react-i18next once per i18n instance so server requests no longer grow its plugin list.

  fix(plugin-i18n): 每个 i18n 实例只注册一次 react-i18next，避免服务端每个请求都让插件列表变长。

- Updated dependencies [4d498bb]
  - @modern-js/plugin@3.11.3
  - @modern-js/server-core@3.11.3
  - @modern-js/server-runtime@3.11.3
  - @modern-js/runtime-utils@3.11.3
  - @modern-js/types@3.11.3
  - @modern-js/utils@3.11.3

## 3.11.2

### Patch Changes

- @modern-js/server-core@3.11.2
- @modern-js/server-runtime@3.11.2
- @modern-js/plugin@3.11.2
- @modern-js/runtime-utils@3.11.2
- @modern-js/types@3.11.2
- @modern-js/utils@3.11.2

## 3.11.1

### Patch Changes

- Updated dependencies [fc6ee73]
- Updated dependencies [b11c3cd]
  - @modern-js/plugin@3.11.1
  - @modern-js/server-core@3.11.1
  - @modern-js/types@3.11.1
  - @modern-js/server-runtime@3.11.1
  - @modern-js/runtime-utils@3.11.1
  - @modern-js/utils@3.11.1

## 3.11.0

### Patch Changes

- Updated dependencies [6a50ea0]
  - @modern-js/runtime-utils@3.11.0
  - @modern-js/server-core@3.11.0
  - @modern-js/server-runtime@3.11.0
  - @modern-js/plugin@3.11.0
  - @modern-js/types@3.11.0
  - @modern-js/utils@3.11.0

## 3.10.4

### Patch Changes

- @modern-js/server-core@3.10.4
- @modern-js/server-runtime@3.10.4
- @modern-js/plugin@3.10.4
- @modern-js/runtime-utils@3.10.4
- @modern-js/types@3.10.4
- @modern-js/utils@3.10.4

## 3.10.3

### Patch Changes

- Updated dependencies [52b4a4e]
  - @modern-js/server-core@3.10.3
  - @modern-js/server-runtime@3.10.3
  - @modern-js/plugin@3.10.3
  - @modern-js/runtime-utils@3.10.3
  - @modern-js/types@3.10.3
  - @modern-js/utils@3.10.3

## 3.10.2

### Patch Changes

- Updated dependencies [76c675d]
- Updated dependencies [2f314e5]
- Updated dependencies [b1c1018]
- Updated dependencies [23587d0]
- Updated dependencies [3b42ce4]
- Updated dependencies [6a891f0]
  - @modern-js/runtime-utils@3.10.2
  - @modern-js/server-core@3.10.2
  - @modern-js/plugin@3.10.2
  - @modern-js/server-runtime@3.10.2
  - @modern-js/types@3.10.2
  - @modern-js/utils@3.10.2
