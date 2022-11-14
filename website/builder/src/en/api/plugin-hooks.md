---
extractApiHeaders: [2]
---

# Plugin Hooks

This section describes the lifetime hooks provided by Builder.

## Overview

- **Common Hooks**
  - `modifyBuilderConfig`: Modify raw config of Builder.
  - `modifyWebpackChain`: Modify webpack-chain.
  - `modifyWebpackConfig`: Modify raw config of webpack.
  - `onBeforeCreateCompiler`: Before creating bundler instance.
  - `onAfterCreateCompiler`: After creating bundler instance, used to handle bundler instances.
- **Build Hooks**：Only for building.
  - `onBeforeBuild`: Before running the building.
  - `onAfterBuild`: After running the building, you can access the result stats here.
- **Dev Server Hooks**: Only for dev server.
  - `onBeforeStartDevServer`: Before running the dev server.
  - `onAfterStartDevServer`: After running the dev server.
  - `onDevCompileDone`: When each incremental building done.
- **Process Hooks**
  - `onExit`: When the process is going to exit.

## Common Hooks

### modifyBuilderConfig

TODO

### modifyWebpackChain

TODO

### modifyWebpackConfig

TODO

### onBeforeCreateCompiler

TODO

### onAfterCreateCompiler

TODO

## Build Hooks

### onBeforeBuild

TODO

### onAfterBuild

TODO

## Dev Server Hooks

### onBeforeStartDevServer

TODO

### onAfterStartDevServer

TODO

### onDevCompileDone

TODO

## Process Hooks

### onExit

TODO
