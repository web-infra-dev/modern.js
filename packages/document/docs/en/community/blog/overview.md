---
sidebar_position: 1
---

# Overview

Welcome to Modern.js blog!

You can find the latest update of Modern.js and our thought processes here. Occasionally we explain the infrastructure behind it.

## Announcing Modern.js v2: support Rspack

> Published on 16.03.2023

We are excited to announce the release of Modern.js v2!

Modern.js is a suite of infrastructure tools we built for web development inside Bytedance (we call ourself Web Infra). Since we open sourced this project a little more than a year ago, there were dozens of contributors helped us on development; we aggregated more than 2,000 pull requests and Modern.js started to support build tool like Rspack, features like nested routes, Streaming SSR and there are more to come!

We are extremely proud of what we have achieved so far, you can also refer to [this article(English version under construction)](/community/blog/v2-release-note)👈🏻 to see what has changed over the last year in Modern.js.

## What is Streaming SSR in React 18

> Published on 16.12.2022

Since React 18, React supports a new type of SSR (streaming SSR) and it brought two advantages over the React tool chain:

- Streaming HTML: Server will be able to transmit HTML to browser parts by parts, rather than waiting until the whole page being rendered. Client side will render the page faster thus dramatically increase performance benchmark scores like TTFB(Time to First Byte), FCP(First Contentful Paint) and more.

- Selective Hydration: On the client side, browser can hydrate only the HTML elements that has already been rendered, without needing to wait until the whole page finish rendering and all the javascript bundle being loaded.

To understand its design further, check out this [Github Discussion](https://github.com/reactwg/react-18/discussions/37) by Dan Abramov or watch this [talk](https://www.youtube.com/watch?v=pj5N-Khihgc).

Or read more from us at [here(Further content in English under construction)](https://mp.weixin.qq.com/s/w4FS5sBcHqRl-Saqi19Y6g).

## Introducing React Server Component in Modern.js

> Published on 01.12.2022

To explain the experimental React Server Component, the one-liner given by the React Team was: **zero-bundle-size React Server Components**.

We agreed with the React team that this is where the whole direction will move forward in React. Open source maintainers and contributors inside the React community are also actively building an eco-system around it.

Read more from React team at [here](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components) or more from us at [here](https://mp.weixin.qq.com/s/B-XLvW00vl5RE1Ur3EW4ow)

## Updates during Sept - Oct in 2022

> Published on 01.11.2022

We updated Modern.js to v1.21.0 during Sept - Oct. Major upgrade includes:

- **support pnpm v7**
- **added typescript compiler option on server side**

[Read more (English version under construction)](/community/blog/2022-0910-updates)

## Updates during July - August in 2022

> Published on 2022.09.05

Modern.js upgraded to v1.17.0 during July to August in 2022. Major updates include:

- **Support React 18**
- **Unifying packages**: All the Modern.js package version numbers are unified, and added version update command line in CLI.
- **Support npm module bundle building**: We support bundling npm module output.
- **Reduck v1.1**: We released [Reduck v1.1](https://github.com/web-infra-dev/reduck) and updated all our documentations.

[Read more (English version under construction)](/community/blog/2022-0708-updates)
