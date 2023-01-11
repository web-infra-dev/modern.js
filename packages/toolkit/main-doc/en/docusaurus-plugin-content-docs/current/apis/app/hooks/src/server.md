---
title: '*.[server|node].[tj]sx'
sidebar_position: 8
---

Used in application projects to place server side code, it generally has the following two functions：

1. When `*.tsx` and `*. [server|node].tsx` coexist, rendering on the server side will give preference to the `*. [server|node].tsx` file instead of the `*.tsx` file.

2. When using [data loader](/docs/guides/basic-features/data-fetch), the server-side dependencies need to be re-exported from this file

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
