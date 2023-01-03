import { MetaAttributes, MetaOptions } from '@modern-js/utils';
import {
  CrossOrigin,
  HtmlInjectTag,
  HtmlInjectTagDescriptor,
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

export const HtmlInjectTagSchema: z.ZodType<HtmlInjectTag> = z.object({
  tag: z.string(),
  attrs: z
    .record(z.union([z.string(), z.boolean(), z.null(), z.undefined()]))
    .optional(),
  children: z.string().optional(),
  hash: z.union([z.string(), z.boolean(), z.anyFunction()]).optional(),
  publicPath: z.union([z.string(), z.boolean(), z.anyFunction()]).optional(),
  append: z.boolean().optional(),
  head: z.boolean().optional(),
});

export const HtmlInjectTagDescriptorSchema: z.ZodType<HtmlInjectTagDescriptor> =
  z.union([HtmlInjectTagSchema, z.anyFunction()]);

export const sharedHtmlConfigSchema = z.partialObj({
  meta: MetaOptionsSchema,
  metaByEntries: z.record(MetaOptionsSchema),
  title: z.string(),
  titleByEntries: z.record(z.string()),
  inject: ScriptInjectSchema,
  injectByEntries: z.record(ScriptInjectSchema),
  tags: z.arrayOrNot(HtmlInjectTagDescriptorSchema),
  tagsByEntries: z.record(z.arrayOrNot(HtmlInjectTagDescriptorSchema)),
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
