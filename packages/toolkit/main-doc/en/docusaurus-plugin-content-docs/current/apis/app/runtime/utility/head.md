---
title: Head
---

Used to add html elements (such as title, meta, script, etc.) to the `<head>` element, supports SSR.

## Usage

```tsx
import { Helmet } from '@modern-js/runtime/head';

export default () => <Helmet>...</Helmet>;
```

## Example

```tsx
import { Helmet } from '@modern-js/runtime/head';

function IndexPage() {
  return (
    <div>
      <Helmet>
        <title>My page title</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Helmet>
      <p>Hello Modern.js!</p>
    </div>
  );
}

export default IndexPage;
```

## More

For detail, see [react-helmet](https://github.com/nfl/react-helmet).
