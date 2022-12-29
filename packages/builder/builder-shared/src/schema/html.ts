import { MetaAttributes, MetaOptions } from '@modern-js/utils';
import {
  CrossOrigin,
  HtmlInjectTag,
  HtmlInjectTagOptions,
  ScriptInject,
  SharedHtmlConfig,
} from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const MetaAttributesSchema: ZodType<MetaAttributes> = z.record(
  z.union([z.string(), z.boolean()]),
);

export const MetaOptionsSchema: ZodType<MetaOptions> = z.record(
  z.union([z.string(), z.literal('false'), MetaAttributesSchema]),
);

export const ScriptInjectSchema: ZodType<ScriptInject> = z.union([
  z.boolean(),
  z.literal('body'),
  z.literal('head'),
]);

export const CrossOriginSchema: ZodType<CrossOrigin> = z.literals([
  'anonymous',
  'use-credentials',
]);

export const HtmlInjectControlSchema = z.partialObj({
  append: z.boolean(),
  publicPath: z.union([
    z.boolean(),
    z.string(),
    z.function(z.tuple([z.string(), z.string()]), z.string()),
  ]),
});

export const HtmlInjectTagSchema: z.ZodType<HtmlInjectTag> =
  HtmlInjectControlSchema.extend({
    type: z.literals(['script', 'meta', 'link']),
    props: z.record(
      z.string(),
      z.union([z.string(), z.boolean(), z.null(), z.undefined()]),
    ),
    children: z.string(),
    path: z.string(),
  });

export const HtmlInjectTagOptionsSchema: z.ZodType<HtmlInjectTagOptions> =
  HtmlInjectControlSchema.extend({
    children: z.array(HtmlInjectTagSchema),
  });

export const sharedHtmlConfigSchema = z.partialObj({
  meta: MetaOptionsSchema,
  metaByEntries: z.record(MetaOptionsSchema),
  title: z.string(),
  titleByEntries: z.record(z.string()),
  inject: ScriptInjectSchema,
  injectByEntries: z.record(ScriptInjectSchema),
  tags: HtmlInjectTagOptionsSchema,
  tagsByEntries: z.record(HtmlInjectTagOptionsSchema),
  favicon: z.string(),
  faviconByEntries: z.record(z.string()),
  appIcon: z.string(),
  mountId: z.string(),
  crossorigin: z.union([z.boolean(), CrossOriginSchema]),
  disableHtmlFolder: z.boolean(),
  template: z.string(),
  templateByEntries: z.record(z.string()),
  templateParameters: z.chained(z.record(z.unknown())),
  templateParametersByEntries: z.record(z.chained(z.record(z.unknown()))),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedHtmlConfig> = sharedHtmlConfigSchema;
