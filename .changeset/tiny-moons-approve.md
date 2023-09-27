---
'@modern-js/builder-rspack-provider': minor
---

feat(builder): use Rspack builtin:swc-loader & disableTransformByDefault instead of builtin transform
- Support output.polyfill.usage and source.exclude configuration
- Modifying translation configuration through builtins.react/presetEnv/xxx is no longer supported，for more information please refer to: [rspack#disabletransformbydefault](https://www.rspack.dev/config/experiments.html#disabletransformbydefault)
- Modify swc related configuration (old builtins.pluginsImport, etc.) can be through [`chain.module.rule(CHAIN_ID.RULE.JS).use(CHAIN_ID.USE.SWC).tap()`](https://modernjs.dev/builder/en/guide/advanced/rspack-start.html#5-swc-configuration-support) method


feat(builder): 使用 Rspack builtin:swc-loader 和 disableTransformByDefault 代替默认的转译行为
- 支持 output.polyfill.usage 和 source.exclude 配置项
- 不再支持通过 builtins.react/presetEnv/xxx 修改转译配置。详见：[rspack#disabletransformbydefault](https://www.rspack.dev/zh/config/experiments.html#disabletransformbydefault)
- 修改 swc 相关配置(老的 builtins.pluginsImport 等) 可通过 [`chain.module.rule(CHAIN_ID.RULE.JS).use(CHAIN_ID.USE.SWC).tap()`](https://modernjs.dev/builder/guide/advanced/rspack-start.html#5-swc-%E9%85%8D%E7%BD%AE%E6%94%AF%E6%8C%81) 方式
