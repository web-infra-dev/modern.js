---
title: Create Project
---

Starting from this chapter, we will enter the practical tutorial section. In the practical tutorial, we will start with environment preparation, starting from simple to complex, building a real project step by step.

## Environment preparation

import Prerequisites from '@site-docs/components/prerequisites.md'

<Prerequisites />

## Initialization project

We create a new directory and initialize the project via the command line tool:

```bash
mkdir myapp && cd myapp
npx @modern-js/create
```

import InitApp from '@site-docs/components/init-app.md'

<InitApp />

## Debug Project

import DebugApp from '@site-docs/components/debug-app.md'

<DebugApp />

## Modify the code

We delete the original sample code and replace it with a simple point of contact list:

```tsx title="src/routes/page.tsx"
const getAvatar = (users: Array<{ name: string; email: string }>) =>
  users.map(user => ({
    ...user,
    avatar: `https://avatars.dicebear.com/v2/identicon/${user.name}.svg`,
  }));

const mockData = getAvatar([
  { name: 'Thomas', email: 'w.kccip@bllmfbgv.dm' },
  { name: 'Chow', email: 'f.lfqljnlk@ywoefljhc.af' },
  { name: 'Bradley', email: 'd.wfovsqyo@gpkcjwjgb.fr' },
  { name: 'Davis', email: '"t.kqkoj@utlkwnpwk.nu' },
]);

function App() {
  return (
    <ul>
      {mockData.map(({ name, avatar, email }) => (
        <li key={name}>
          <img src={avatar} width={60} height={60} /> ---
          <span>{name}</span> ---
          <span>{email}</span>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

Remove redundant css files and keep the directory free of redundant files:

```bash
rm src/routes/index.css
```

Since the framework supports [HMR](https://webpack.js.org/concepts/hot-module-replacement/) by default, you can see that the content in http://localhost:8080/ is automatically updated to:

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvt/ljhwZthlaukjlkulzlp/screenshot-20221214-141909.png)

The page has no styles at the moment. The next chapter will expand on this section.

## Enable SSR

Next, we modify the `modern.config.ts` in the project to enable the SSR capability:

```ts
import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
  },
  plugins: [AppToolsPlugin()],
});
```

Re-execute `pnpm run dev` to find that the project has completed page rendering at the server level.
