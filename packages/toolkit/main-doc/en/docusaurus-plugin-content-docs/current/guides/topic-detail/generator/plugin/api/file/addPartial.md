---
sidebar_position: 3
---

# addPartial

For text files, add a customized Partial fragment of Handlebars, the specific viewable document [Partials](https://handlebarsjs.com/guide/#partials).

This method is available on the `onForged` time to live API parameter.

Its type is defined as:

```ts
export type ForgedAPI = {
  addPartial: (name: string, str: Handlebars.Template) => void;
  ...
};
```

## name

partial name.

## str

partial template string.
