---
title: '*.[server|node].[tj]sx'
sidebar_position: 8
---

应用项目中使用，用于放置服务端代码，一般有以下两个作用：

1. 当 `*.tsx` 和 `*.[server|node].tsx` 共存时，SSR 在服务端执行渲染时，会优先使用 `*.[server|node].tsx` 文件，而不是 `*.tsx` 文件。

2. 在使用 [data loader](/docs/guides/basic-features/data-fetch) 时，需要将服务端的依赖从该文件中做重导出

```tsx
// routes/user/avatar.tsx
import { useLoaderData } from '@modern-js/runtime/router';
import { readFile } from './utils.server';

type ProfileData = {
  /* some type declarations */
};

export const loader = async (): ProfileData => {
  const profile = await readFile('profile.json');
  return profile;
};

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}

// routes/user/utils.server.ts
export * from 'fs-extra';
```
