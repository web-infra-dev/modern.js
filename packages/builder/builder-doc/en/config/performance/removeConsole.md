- Type: `boolean | ConsoleType[]`
- Default: `false`

Whether to remove `console.xx` in production build.

#### Remove all consoles

When `removeConsole` is set to `true`, all types of `console.xx` are removed:

```ts
export default {
  performance: {
    removeConsole: true,
  },
};
```

#### Remove specific console

You can also specify to remove only certain types of `console.xx`, such as `console.log` and `console.warn`:

```ts
export default {
  performance: {
    removeConsole: ['log', 'warn'],
  },
};
```

The following types of console are currently supported:

```ts
type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';
```
