# General

## The relationship between Modern.js Builder and Modern.js?

The building abilities of Modern.js 2.0 are based on Modern.js Builder.

When developing Modern.js 2.0, we designed Builder as an independent module, and clearly divided the responsibilities of Builder and Modern.js. Therefore, Builder can be used independently of the Modern.js framework and be applied to other frameworks or scenarios.

## Can Builder be used to build libraries or UI components?

Builder focuses on solving web application building scenarios. We do not recommend that you use Builder to build libraries or UI components.

If you need to build a library or UI components, it is recommended to use the [Modern.js module tools](http://modernjs.dev/).

## Will Builder support turbopack?

[turbopack](https://turbo.build/pack) is the rust-powered successor to webpack, we will continue to pay attention to it.

At present, turbopack only supports use in next.js. When turbopack can be used independently, and the completion and community ecology reach a certain level, we will also consider to support it.
