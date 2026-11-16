# Bundled fonts / 随附字体

The following files are copied without modification from the npm package [`@fontsource/inter@5.3.0`](https://www.npmjs.com/package/@fontsource/inter/v/5.3.0):

| Local file                    | Source in the package               |
| ----------------------------- | ----------------------------------- |
| `inter-latin-400-normal.woff` | `files/inter-latin-400-normal.woff` |
| `inter-latin-700-normal.woff` | `files/inter-latin-700-normal.woff` |
| `OFL.txt`                     | `LICENSE`                           |

The font is [Inter](https://github.com/rsms/inter), copyright 2016 The Inter Project Authors. The accompanying [SIL Open Font License 1.1](./OFL.txt) applies to these files. Keep this license when redistributing the fonts.

These static WOFF files provide Latin glyphs at normal style and weights 400 and 700. They are loaded directly by Satori, without network requests or system fonts. They do not provide Chinese glyphs. To add Chinese, choose a suitably licensed static TTF, OTF or WOFF font with the required glyphs, register it in `../render.tsx`, preserve its license and verify the rendered images.

上述字体文件从 npm 包 `@fontsource/inter@5.3.0` 原样提取，`OFL.txt` 对应包内的 `LICENSE`，未修改字体。字体作者为 Inter Project Authors，分发字体时应保留随附的 SIL Open Font License 1.1。

这两个静态 WOFF 文件仅包含拉丁字符，分别提供正常样式的 400 和 700 字重。Satori 直接读取文件，不依赖网络或系统字体。如需中文，请加入具有所需字形和适用许可证的静态 TTF、OTF 或 WOFF 字体，在 `../render.tsx` 中注册，并保留许可证及检查渲染结果。
