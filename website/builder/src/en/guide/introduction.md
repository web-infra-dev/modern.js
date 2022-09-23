# Introduction

Modern.js Builder is **a Universal Build Engine for Modern Web Development**.

Based on the best practices of thousands web applications in ByteDance, we created Modern.js Builder to provide useful features for web development.

## Features

### Multiple Build Engines

**Builder supports two build engines: webpack & rspack**.

Builder uses webpack as the default bundler, integrates [babel](https://github.com/babel/babel), [postcss](https://github.com/postcss/postcss), [terser](https://github.com/terser/terser) and other tools to transform or minify codes. And also support using [swc](https://github.com/swc-project/swc) and [esbuild](https://github.com/evanw/esbuild) to improving the compile speed.

At the same time, We are integrating rspack to improve compilation speed, rspack is a Rust Bundler developed by ByteDance.

At present, the webpack build engine is stable for production, and the rspack build engine is still under heavy development.

### Deep optimization

At this stage, webpack is still the most mature bundler for product optimization.

Builder **makes full use of various optimization strategies** in the webpack ecosystem to ensure the product performance in the production environment.

Taking the chunk splitting scenario as an example, the webpack's splitChunks config is complex, and Builder makes it as an out-of-the-box [performance.chunkSplit](/en/api/config-performance.html#performance-chunksplit) config, it will split common third-party libraries into chunks to make page loading faster.

### Extensible Plugin System

Provides rich configuration items and a flexible plugin system to support in-depth customization of all features.

All the building abilities of Builder are implemented through plugins:

- Most of the plugins are lightweight, built in Builder, and can be enabled or disabled through configs.
- Some plugins are more complex and developed as independent npm packages, which can be optionally installed and registered.

Builder supports custom plugins, allowing framework developers to implement customized build abilities.

## Next Step

You may want:

<NextSteps>
  <Step href="/guide/quick-start.html" title="Quick Start" description="Learn how to use Builder"/>
  <Step href="/guide/features.html" title="All Features" description="Learn all features of Builder"/>
  <Step href="/api" title="API Reference" description="View detailed API documentation"/>
</NextSteps>
