# Open Graph images with Modern.js

[中文说明](./README.zh-CN.md)

An article page with a 1200 × 630 PNG share image, rendered from JSX with [Satori](https://github.com/vercel/satori) and [Resvg](https://github.com/thx/resvg-js). By default, images are generated during the build and served as static files. An optional configuration keeps the request-time BFF implementation.

Both configurations use SSR for the article pages. Their initial HTML contains the title, description, canonical URL and absolute `og:image` URL, so share crawlers do not need to execute JavaScript. Image generation does not depend on SSG.

![Generated article share image](./preview.png)

[Long-title preview](./preview-long-title.png). Both modes use the same template and bundled fonts to produce these images.

|                                  | Build-time images (default)    | Request-time images (optional)      |
| -------------------------------- | ------------------------------ | ----------------------------------- |
| Configuration                    | `modern.config.ts`             | `modern.bff.config.ts`              |
| Development                      | `pnpm dev`                     | `pnpm dev:bff`                      |
| Build / preview                  | `pnpm build` / `pnpm serve`    | `pnpm build:bff` / `pnpm serve:bff` |
| Image URL                        | `/static/og/<slug>.<hash>.png` | `/api/og/<slug>?v=1`                |
| Image rendering after deployment | None                           | BFF handler on uncached requests    |
| Page rendering                   | SSR                            | SSR                                 |

## Run

Use Node.js 22.18 or later in the 22.x line, or Node.js 24.3 or later, as declared in `package.json`. The Modern.js packages are pinned to the validated 3.11.3 release.

From the repository root:

```bash
pnpm install
cd examples/og-image
pnpm dev
```

If you copy this directory into a standalone project, run `pnpm install` there instead. The example does not need external APIs or credentials.

Open the [article](http://localhost:8080/posts/hello-modern) or [long-title page](http://localhost:8080/posts/long-title). Each page links to its PNG. The default development command generates images before compilation, then serves them as static assets. Restart development after changing article data, the image template or fonts to regenerate the images and their URL map.

`SITE_URL` is the public HTTP(S) origin, with no path, query or credentials. It defaults to `http://localhost:8080`. Modern.js embeds it at development startup or build time so the server and browser use the same absolute metadata URLs. Set it to the externally reachable origin before building, including when a reverse proxy terminates HTTPS. Setting it only when starting an existing build does not change those URLs.

```bash
SITE_URL=https://journal.example.com pnpm build
pnpm serve
```

For local production checks, omit `SITE_URL` to use port 8080. Stop the running server before switching modes, and use matching build and serve commands.

## Build-time images

[Next.js image metadata routes](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) can render images during the build when their inputs allow static optimization. This example follows that workflow with an explicit local build plugin and metadata wiring:

1. `config/build-og-images.ts` enumerates the articles in `shared/posts.ts` before compilation.
2. `shared/og/render.tsx` converts the JSX template into SVG with Satori, then PNG with Resvg. The build plugin loads TSX through the TypeScript runtime registered by Modern.js.
3. The plugin writes PNGs into the ignored `.og-images` directory, using a hash of the PNG bytes in each filename. Rsbuild copies them into `dist/static/og`.
4. It injects a slug-to-image-path map into the page bundles. The page loader combines the selected path with `SITE_URL`, and `Helmet` writes it into the initial HTML.

`pnpm build` produces the images without starting a server. Rendering failures fail the build. The default configuration does not import or register the BFF plugin, and does not compile an image API. It also does not enable an SSG plugin or prerender article HTML. The images can be hosted as ordinary static files, while this example continues to render pages through SSR.

This is an example-level plugin with an explicit list of articles. Next.js supplies its own file convention and static/dynamic route analysis. To integrate a CMS here, fetch and enumerate the required content during generation, then rebuild when it changes. Request-specific or newly added content that is unavailable at build time needs a separate generation workflow, such as the optional BFF configuration.

## Build and deploy

```bash
pnpm typecheck
pnpm build
pnpm serve
```

To create the self-contained Node.js deployment output for the SSR pages:

```bash
SITE_URL=https://journal.example.com MODERNJS_DEPLOY=node pnpm run deploy
PORT=8080 node .output/index
```

`modern deploy` also runs the build. Copy the entire `.output` directory to the target machine. In the default mode, `.output/static/og` contains the ready-to-serve PNGs. Image rendering, fonts, Satori and Resvg are not needed in that deployed application. The Node.js process in this example handles SSR and static-file delivery.

Resvg uses a native binary on the machine generating the images. For the default mode, that is the build machine. For the BFF mode, it is also the deployment machine, so install and build for the target operating system and architecture. Local Node.js validation does not verify Vercel, Netlify, other operating systems or edge runtimes.

## Optional BFF mode

```bash
pnpm dev:bff
# Or build and preview
pnpm build:bff
pnpm serve:bff
# Or create deployment output
SITE_URL=https://journal.example.com MODERNJS_DEPLOY=node pnpm run deploy:bff
PORT=8080 node .output/index
```

`modern.bff.config.ts` enables the BFF plugin and supplies `/api/og/<slug>?v=1` paths to the same page loader. `api/lambda/og/[slug].ts` calls the shared renderer and returns a standard `Response` containing a `Uint8Array`, with `Content-Type: image/png`. Returning a bare `Buffer` would use BFF's ordinary JSON serialization instead of this binary response path. Unknown articles return 404 with `Cache-Control: no-store`.

For this mode, the server build copies the shared renderer and `shared/og/assets` into `dist/shared`, then `.output/shared`. Fonts are resolved relative to `__dirname`, so the output can run from another working directory without source files or system fonts. Keep the accompanying font license with the deployment.

The package includes `@modern-js/plugin-bff` for this optional mode only. A standalone project using only build-time generation can remove that dependency, `api`, `modern.bff.config.ts` and the `*:bff` scripts.

## Verify a running server

With the matching dev, production or deployment server running in another terminal:

```bash
# Default build-time mode
node scripts/verify.mjs http://localhost:8080
# Optional BFF mode
node scripts/verify.mjs --bff http://localhost:8080
# Save PNGs and raw HTML for inspection
node scripts/verify.mjs http://localhost:8080 /tmp/modern-og-preview
```

The verifier checks raw HTML metadata, PNG headers and dimensions, long titles and missing articles. In build-time mode it also checks that each filename hash matches the received PNG and that the BFF image endpoint returns 404. In BFF mode it checks the versioned URL and cache headers.

Use the same origin as the `SITE_URL` used to start development or build the app. To test deployment isolation, copy `.output` outside the repository, start its `index.js` there, and run this verifier against it.

## Template and fonts

Satori implements a [limited subset of HTML and CSS](https://github.com/vercel/satori#css). This template uses inline styles and flex layout. Longer titles use smaller type and a three-line clamp to protect the author row. The full title remains in the page and metadata. Arbitrary browser layouts or unbounded user input need additional layout checks.

The renderer loads bundled fonts once per process and disables system font loading. The Inter files contain Latin glyphs for this English example and use static WOFF fonts. For Chinese text, add an appropriately licensed static TTF, OTF or WOFF font containing the required glyphs, register its data and weights in `shared/og/render.tsx`, and update `fontFamily`. Keep its license and inspect rendered output for missing glyphs and wrapping. See [font provenance](./shared/og/assets/README.md).

## Caching and updates

Build-time filenames contain a hash of the rendered PNG. Rebuilding after a visible content, template or font change produces a new URL automatically. Static response cache headers belong to the static host or CDN. You can configure long-lived immutable caching for these hashed URLs. Publish images together with the matching page bundles, and keep older images available while cached HTML may still refer to them. The example replaces its generated files on each build and does not preserve past releases.

BFF responses use `Cache-Control: public, max-age=3600, s-maxage=86400`, allowing one hour in browsers and one day in shared caches that honor these directives. There is no application image cache, so every uncached request renders again. Increment `imageVersion` in `shared/posts.ts` when changing BFF image content, the template or fonts. Configure the CDN cache key to include `v`. This query parameter does not preserve historical images or forcibly purge caches.

Image caching and SSR page caching are separate layers. Image headers do not configure page caches. Sharing services can cache metadata and images independently of your CDN, so refresh cached HTML and sharing-service previews as needed.
