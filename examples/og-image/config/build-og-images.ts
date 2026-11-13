import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { posts } from '../shared/posts';

export const buildOgImagesPlugin = (): CliPlugin<AppTools> => ({
  name: 'example-build-og-images',
  setup(api) {
    // Runs before compilation in dev/build, including the build in modern deploy.
    // No image handler is installed in the production server.
    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      // Defer the TSX import until Modern.js has registered its TypeScript
      // runtime for dev/build. Configuration loading itself does not enable JSX.
      const { renderOgImage } = createRequire(__filename)(
        '../shared/og/render.tsx',
      ) as typeof import('../shared/og/render');
      const directory = path.join(
        api.getAppContext().appDirectory,
        '.og-images',
      );
      await rm(directory, { recursive: true, force: true });
      await mkdir(directory, { recursive: true });

      const imagePaths: Record<string, string> = {};
      for (const post of posts) {
        if (
          !/^[a-z0-9-]+$/.test(post.slug) ||
          Object.hasOwn(imagePaths, post.slug)
        ) {
          throw new Error(
            `Expected a unique, URL-safe article slug: ${post.slug}`,
          );
        }
        const png = await renderOgImage(post);
        const hash = createHash('sha256')
          .update(png)
          .digest('hex')
          .slice(0, 12);
        const filename = `${post.slug}.${hash}.png`;
        await writeFile(path.join(directory, filename), png);
        imagePaths[post.slug] = `/static/og/${filename}`;
      }

      console.log(`Generated ${posts.length} OG images before compilation`);
      Object.assign(
        config,
        mergeRsbuildConfig(config, {
          source: {
            define: { __OG_IMAGE_PATHS__: JSON.stringify(imagePaths) },
          },
          environments: {
            client: {
              output: { copy: [{ from: directory, to: 'static/og' }] },
            },
          },
        }),
      );
    });
  },
});
