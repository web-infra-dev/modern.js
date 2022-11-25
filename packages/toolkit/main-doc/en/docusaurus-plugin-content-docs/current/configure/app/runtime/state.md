---
sidebar_label: state
---

# runtime.state

* Type:`boolean | object`
* Default: `false`

Once `state` is enabled, you can use [Model](/docs/guides/topic-detail/model/quick-start) for state management.

The specific configuration items are as follows:

## `immer`

* Type:`boolean`
* Default: `true`

Whether to enable to update the state with mutable, it is enabled by default, and set to `false` if you want to disable it.

## `effects`

* Type:`boolean`
* Default: `true`

Whether to enable the side effect management feature, it is enabled by default, and set to `false` if you want to disable it.

## `autoActions`

* Type:`boolean`
* Default: `true`

Whether to enable the auto-generated actions feature, it is enabled by default, and set to `false` if you want to disable it.


## `devtools`

* Type:`boolean | EnhancerOptions`
* Default: `true`

Whether to enable devtools, it is enabled by default, and all parameters of [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md) are supported at the same time. If you want to disable it, set it to `false`.
