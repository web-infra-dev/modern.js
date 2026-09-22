# Custom i18n wrapper

This browser integration fixture covers an application-provided i18n wrapper
passed to the runtime configuration as `i18nInstance`. It models a custom
translation API built on top of i18next:

- The native i18next instance is exposed as `i18nInstance.instance`.
- Calling the custom instance's `init()` initializes its own translation API.
  Initializing only the native instance does not make direct `I18n.t()` calls work.
- Plugin registration is deferred until initialization. Cloning preserves the
  initialized translation API and uses the cloned native instance throughout.
- The custom instance does not expose a read-only `isInitialized` property.

The default entry uses string SSR with locale path redirection disabled. Tests
inspect the raw HTTP response for query, cookie, and header language detection,
including `zh-Hant-TW`, and then verify browser hydration. This prevents a redirect
from selecting the language through the URL path before the request detector runs.
SSR assertions do not retry fallbacks.

The `/csr` entry disables SSR and imports the same `I18n` singleton used by the
runtime configuration. Its test checks direct `I18n.t()` calls and locale URLs on
the initial render and after switching languages. This covers the regression where
passing only `I18n.i18nInstance.instance` fixes SSR but leaves the custom instance
uninitialized in CSR.

The `/csr/detect` route skips locale redirects. Its test verifies browser query
detection without a server redirect supplying the language through the URL path.

## Coverage retained when consolidating the fixtures

This application extends the existing `custom-i18n-wrapper` CSR fixture with SSR
regression coverage. Both share one instance implementation, resource loader,
runtime configuration, and browser test setup.

| Case | Coverage |
| --- | --- |
| Existing CSR resource loading | Accept the original initial translation, then require the SDK translation through the context instance. |
| Existing CSR language switch | Switch en → zh → en and retain the original translation assertions. |
| SSR query detection | Request `?lng=zh-Hant-TW` and inspect the raw server HTML and serialized language. |
| SSR cookie detection | Send the i18next cookie and inspect the raw server HTML and serialized language. |
| SSR header detection | Send Accept-Language and inspect the raw server HTML and serialized language. |
| SSR hydration | Keep the server-selected language after React hydration. |
| CSR query detection | Detect the query language without an HTTP redirect or client-side URL change. |
| CSR direct calls | Initialize the imported custom instance and translate through `I18n.t()` before and after language switches. |

The CSR page keeps the context instance's `loaded` and `languageChanged` event
subscriptions for the existing SDK tests, alongside the direct `I18n.t()` output.
Its supported languages additionally include `zh` to preserve the existing
en/zh cases. The SSR entry retains its en/zh-Hant-TW configuration.
