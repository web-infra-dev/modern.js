# HMR FAQ

### HMR not working when external React?

To ensure that HMR works properly, we need to use the development builds of React and ReactDOM.

If you exclude React via `externals` when bundling, the production build of React is usually injected through CDN, and this can cause HMR to fail.

```js
export default {
  output: {
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
};
```

To solve this problem, you need to reference the development builds of React or not configure `externals` in the development environment.

If you are unsure about the type of React build you are using, you can refer to the [React documentation - Use the Production Build](https://legacy.reactjs.org/docs/optimizing-performance.html#use-the-production-build).

---

### HMR not working when setting filename hash in development mode?

Usually, we only set the filename hash in the production mode (i.e., when `process.env.NODE_ENV === 'production'`).

If you set the filename hash in the development mode, it may cause HMR to fail (especially for CSS files). This is because every time the file content changes, the hash value changes, preventing tools like [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin) from reading the latest file content.

- Correct usage:

```js
export default {
  output: {
    filename: {
      css:
        process.env.NODE_ENV === 'production'
          ? '[name].[contenthash:8].css'
          : '[name].css',
    },
  },
};
```

- Incorrect usage:

```js
export default {
  output: {
    filename: {
      css: '[name].[contenthash:8].css',
    },
  },
};
```

---

### HMR not working when updating React components?

Builder uses React's official [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) capability to perform component hot updates.

If there is a problem that the hot update of the React component cannot take effect, or the state of the React component is lost after the hot update, it is usually because your React component uses an anonymous function. In the official practice of React Fast Refresh, it is required that the component cannot be an anonymous function, otherwise the state of the React component cannot be preserved after hot update.

Here are some examples of wrong usage:

```tsx
// bad
export default function () {
  return <div>Hello World</div>;
}

// bad
export default () => <div>Hello World</div>;
```

The correct usage is to declare a name for each component function:

```tsx
// good
export default function MyComponent() {
  return <div>Hello World</div>;
}

// good
const MyComponent = () => <div>Hello World</div>;

export default MyComponent;
```

---

### HMR not working when use https?

If https is enabled, the HMR connection may fail due to a certificate issue, and if you open the console, you will get an HMR connect failed error.

![hmr-connect-error-0](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/img_v2_2f90d027-a232-4bd8-8021-dac3c651682g.jpg)

The solution to this problem is to click on "Advanced" -> "Proceed to xxx (unsafe)" on the Chrome problem page.

![hmr-connect-error-1](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/3d2d4a38-acfe-4fe2-bdff-48b3366db481.png)

> Tips: When accessing the page through Localhost, the words "Your connection is not private" may not appear and can be handled by visiting the Network domain.
