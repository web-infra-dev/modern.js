---
'@modern-js/builder-rspack-provider': minor
---

feat(builder): use Rspack builtin:swc-loader & disableTransformByDefault instead of builtin transform, Modifying translation configuration through builtins.react/presetEnv/xxx is no longer supported，for more information please refer to: https://www.rspack.dev/config/experiments.html#disabletransformbydefault

feat(builder): 使用 Rspack builtin:swc-loader 和 disableTransformByDefault 代替默认的转译行为, 不再支持通过 builtins.react/presetEnv/xxx 修改转译配置。详见：https://www.rspack.dev/zh/config/experiments.html#disabletransformbydefault
