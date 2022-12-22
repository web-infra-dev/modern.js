import { MetaAttributes, MetaOptions } from '@modern-js/utils';
import { CrossOrigin, ScriptInject, SharedHtmlConfig } from '../types';
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

export const sharedHtmlConfigSchema: ZodType<SharedHtmlConfig> = z.partialObj({
  meta: MetaOptionsSchema,
  metaByEntries: z.record(MetaOptionsSchema),
  title: z.string(),
  titleByEntries: z.record(z.string()),
  inject: ScriptInjectSchema,
  injectByEntries: z.record(ScriptInjectSchema),
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
