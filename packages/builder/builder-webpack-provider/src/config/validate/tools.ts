import {
  z,
  FileFilterUtilSchema,
  sharedToolsConfigSchema,
} from '@modern-js/builder-shared';
import type { InspectorPluginOptions, ToolsConfig } from '../../types';

export const InspectorPluginOptionsScheme: z.ZodType<InspectorPluginOptions> =
  z.partialObj({
    port: z.number(),
    ignorePattern: z.union([z.instanceof(RegExp), z.null()]),
  });

export const toolsConfigSchema: z.ZodType<ToolsConfig> =
  sharedToolsConfigSchema.extend({
    pug: z.union([z.literal(true), z.chained(z.any())]),
    sass: z.chained(z.any(), z.object({ addExcludes: FileFilterUtilSchema })),
    less: z.chained(z.any(), z.object({ addExcludes: FileFilterUtilSchema })),
    babel: z.chained(z.any(), z.any()),
    terser: z.chained(z.any()),
    tsLoader: z.chained(
      z.any(),
      z.object({
        addIncludes: z.string(),
        addExcludes: FileFilterUtilSchema,
      }),
    ),
    tsChecker: z.chained(z.any()),
    minifyCss: z.chained(z.any()),
    htmlPlugin: z.chained(
      z.any(),
      z.object({ entryName: z.string(), entryValue: z.any() }),
    ),
    styledComponents: z.chained(z.any()),
    cssLoader: z.chained(z.any(), z.object({ addPlugins: z.function() })),
    styleLoader: z.chained(z.any()),
    cssExtract: z.partialObj({
      pluginOptions: z.any(),
      loaderOptions: z.any(),
    }),
    postcss: z.chained(z.any(), z.object({ addPlugins: z.function() })),
    autoprefixer: z.chained(z.any()),
    webpack: z.chained(z.any(), z.any()),
    webpackChain: z.arrayOrNot(z.function()),
    inspector: z.chained(InspectorPluginOptionsScheme),
  });
