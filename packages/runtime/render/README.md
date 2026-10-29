<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="300" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  A Progressive React Framework for modern web development.
</p>

## Getting Started

Please follow [Quick Start](https://modernjs.dev/en/guides/get-started/quick-start) to get started with Modern.js.

## Documentation

- [English Documentation](https://modernjs.dev/en/)
- [中文文档](https://modernjs.dev)

## Shared HTML rendering

Framework integrations can use these independent entries for ordinary SSR.

| Entry                            | Purpose                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| `@modern-js/render/html`         | JSON script serialization and reading, document slots and Helmet assembly |
| `@modern-js/render/html/server`  | React string rendering, collection and timing                             |
| `@modern-js/render/html/browser` | React hydration and client root creation                                  |

These entries support React 18.3.1 and later and do not import the router or the RSC implementation. The existing `ssr`, `rsc` and `client` entries retain their RSC responsibilities. Applications continue using their framework's public rendering APIs.

Streaming integrations use `@modern-js/render/html/stream` for external React stream assembly, `@modern-js/render/html/node` for Node rendering and `@modern-js/render/html/edge` for Web rendering. The Web entry uses the ordinary streaming API available in React 18.3.1 and later.

`renderDocument` processes template assets and Helmet before inserting large application and data payloads. Integrations with an application title that must participate in Helmet's first-title lookup can select `appFirst`. Apply full-page HTML modifiers after document assembly.

`createDataScript` escapes JSON for HTML and supports existing global variables or JSON script identifiers. `readDataScript` reads the matching script and preserves falsy values. Serialization and parse failures propagate to the framework, which owns its error and fallback policy. Frameworks also retain their component providers, data execution, HTTP response handling and request monitors.

`renderStringElement` accepts a wrapped React tree, an optional `identifierPrefix`, a collection callback and an `onTiming` callback. The same prefix must be passed to `hydrateRenderRoot` to preserve `useId` values. PPR prerendering, postponed state, resume and artifact management remain the responsibility of the consuming framework.

`createDocumentStream` consumes an external React stream with a fixed list of results identified by `source` and `key`. Register the results before streaming starts, including any promises that have already settled. The shared coordinator emits completion scripts after a safe HTML and React continuation boundary. With no registered results, post-shell byte chunks pass through without parsing or copying. Cancelling the output cancels the input and releases its reader.

Frameworks that emit fallback markers can use `createDocumentStreamController` with `canEnqueueScripts` declared up front. Its `enqueueScript` method uses the same safe boundaries. Call `stopResults` when giving up on provider results to finish draining React's fallback bytes without waiting for background data tasks. It does not cancel those tasks. The Node writer exposes the same controls.

`createDeferredBootstrapScript` establishes document-local promises. `createDeferredResultScript` completes them, and `getRenderDataStore` from the browser entry reads values or promises by source and key. Server callers can create isolated stores with `createRenderDataStore`. Rejections retain the transported error representation for the framework's error policy. For a continuation fragment, omit the document shell and reuse the initialization already present in the static document.

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
