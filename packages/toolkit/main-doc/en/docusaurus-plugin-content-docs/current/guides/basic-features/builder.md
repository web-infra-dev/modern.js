---
title: Builder
sidebar_position: 2
---

**Modern.js uses [Modern.js Builder](https://modernjs.dev/builder) to build your Web APP. **

Modern.js Builder is one of the core components of Modern.js. It is a build engine for modern Web development and can be used independently of Modern.js. Modern.js Builder supports multiple bundlers such as webpack and rspack, and it uses webpack by default.

## Build Architecture

From the perspective of building, Modern.js is divided into three layers, from top to bottom:

- Upper-layer framework: Modern.js.
- Universal build engine: Modern.js Builder.
- Low-level bundlers: webpack and rspack.

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/builder-layers-1117.png" style={{ maxWidth: '540px' }} />

## Builder Documentation

Since Modern.js Builder is a module that can be used independently, we provide a separate document for it, the site address is: [modernjs.dev/builder](https://modernjs.dev/builder).

In this document, you can learn about the detailed introduction of Modern.js Builder, and you can also find a complete usage guide for each building features. When you encounter building issues, it is recommended that you first read the Modern.js Builder documentation to solve them.

## Builder Config

The config of Modern.js is inherited from Modern.js Builder, so you can use all build configs provided by Modern.js Builder in Modern.js.

Take the `html.title` config of Modern.js Builder as an example, you can directly use this config in the `modern.config.ts` file, and it will be automatically passed to Modern.js Builder.

```ts title="modern.config.js"
export default defineConfig({
  html: {
    title: 'example',
  },
});
```

For details of building configs, please refer to [「Modern.js Builder - Builder Config」](https://modernjs.dev/builder/en/guide/basic/builder-config.html).

## Building Features

Modern.js Builder provides a wealth of building features, including dozens of features such as JavaScript compilation, CSS compilation, static resource processing, hot module replacement, code compression, and TS type checking.

We recommend you to read [「Modern.js Builder - All Features」](https://modernjs.dev/builder/en/guide/features.html) to learn all the building features provided by Modern.js Builder.
