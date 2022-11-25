- **Type**

```ts
type DataUriLimitConfig = {
  svg?: number;
  font?: number;
  image?: number;
  media?: number;
};
```

- **Default**

```js
const defaultDatUriLimit = {
  svg: 10000,
  font: 10000,
  image: 10000,
  media: 10000,
};
```

Set the size threshold to inline static assets such as images and fonts.

By default, static assets will be Base64 encoded and inline into the page if the size is less than 10KB.

You can adjust the threshold by setting the `dataUriLimit` config.

Detail:

- `svg`: The threshold of the SVG image.
- `font`: The threshold of the font file.
- `image`: The threshold of non-SVG images.
- `media`: The threshold of media assets such as videos.

#### Example

Set the threshold of images to 5000 Bytes, and set media assets not to be inlined:

```js
export default {
  output: {
    dataUriLimit: {
      image: 5000,
      media: Infinite,
    },
  },
};
```
