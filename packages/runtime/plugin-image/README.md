# @modern-js/plugin-image

> 🚧 The plugin is under active development, and the API is not stable. Please create an issue if you meet any trouble.

The image plugin for Modern.js, which provide an `Image` component to render images with series features for better performance and developer experience.

## Features

- **Built-in Best Practices** 🎯
  - 🚀 Automatic lazy loading for non-viewport images to save CDN bandwidth and improve loading performance.
  - ✨ Built-in blur placeholder for better user experience with minimal cost.

- **Compile-time Optimization** ⚡️
  - 📏 Pre-calculated image dimensions to prevent Cumulative Layout Shift (CLS).
  - 🔄 Optimized image processing pipeline without slowing down the build process.

- **Image Hosting Integration** 🖼️
  - 🔥 High-performance, cache-friendly image processing for images from any source at runtime.
  - 🛠️ No manual image optimization required during development.

- **Responsive Image Loading** 📱
  - 🎨 Automatic generation of multiple image sizes based on responsive configurations.
  - 🌐 Smart format selection based on browser compatibility.
  - 📐 Optimal image size loading for scalable elements.

## Prerequisite

- Node.js: >= 16.14
- [Rsbuild](https://rsbuild.dev/): >= 1.3.5
- [Sharp](https://sharp.pixelplumbing.com): High performance Node.js image processing library.
- [IPX](https://github.com/unjs/ipx) (Optional): Image processing middleware based on sharp. Provides the image processing capabilities for the development server.

## Installation

Install the dependencies:

```bash
$ pnpm add -D sharp ipx
$ pnpm add @modern-js/plugin-image
```

The `sharp` binary is required to be installed on your system, you can install the experimental WebAssembly variant of `sharp` if you have any trouble while installing binary, please refer to the [sharp installation guide](https://sharp.pixelplumbing.com/install/#webassembly) for more details.

The `ipx` package is optional, it provides the image processing capabilities for the development server. You probably no need to install it if you don't want to use the development server or you already have a custom image processing middleware.

## Quick Start

Setup the plugin to your Rsbuild configuration file, set `ipx` to `{}` to enable the optional `ipx` image processing middleware if you already have it installed. Or you must implement your own image loader.

**rsbuild.config.ts**

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginImage } from '@modern-js/rsbuild-plugin-image';

export default defineConfig({
  builderPlugins: [pluginReact(), pluginImage({ ipx: {} })],
});
```

Or if you are using Modern.js, you can setup the plugin in the `modern.config.ts` file.

**modern.config.ts**

```ts
import { appTools, defineConfig } from '@modern-js/app-tools';
import { pluginImage } from '@modern-js/rsbuild-plugin-image';

export default defineConfig({
  plugins: [appTools({ bundler: 'rspack' })],
  builderPlugins: [pluginImage({ ipx: {} })],
});
```

Then configure the `tsconfig.json` file to handle all image assets suffixed with `?image`.

**tsconfig.json**

```json
{
  "compilerOptions": {
    "types": ["@modern-js/rsbuild-plugin-image/types"]
  }
}
```

So that you can use the `<Image />` component in your React application:

```tsx
import { Image } from '@modern-js/plugin-image/runtime';
import imgMountains from './mountains.jpg?image';
//     ^? { url: string; width: number; height: number; thumbnail: ...

export default function App() {
  return (
    <Image src={imgMountains} width={300} placeholder="blur" alt="example" />
    // Will actually request to: /_modern_js/ipx/f_auto,w_300,q_75/static/assets/mountains.085a2b79.jpg
    // <Image /> will infer the height according to the width and keep the aspect ratio,
    // So that it won't take any cumulative layout shift.
    // And a blurred thumbnail will be used as placeholder before the image is loaded.
  )
}
```

## API Reference

> WIP

## Credit

- [next/image](https://nextjs.org/docs/pages/building-your-application/optimizing/images) inspired the design of this plugin.

## License

[MIT](./LICENSE)
