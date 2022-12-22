import {
  AssetsRetryOptions,
  Charset,
  DataUriLimit,
  DisableSourceMapOption,
  DistPathConfig,
  FilenameConfig,
  LegalComments,
  Polyfill,
  SharedOutputConfig,
  SvgDefaultExport,
} from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';
import { BuilderTargetSchema } from './source';

export const DistPathConfigSchema: ZodType<DistPathConfig> = z.partialObj({
  root: z.string(),
  js: z.string(),
  css: z.string(),
  svg: z.string(),
  font: z.string(),
  html: z.string(),
  image: z.string(),
  media: z.string(),
  server: z.string(),
});

export const FilenameConfigSchema: ZodType<FilenameConfig> = z.partialObj({
  js: z.string(),
  css: z.string(),
  svg: z.string(),
  font: z.string(),
  image: z.string(),
  media: z.string(),
});

export const CharsetSchema: ZodType<Charset> = z.literals(['ascii', 'utf8']);

export const PolyfillSchema: ZodType<Polyfill> = z.literals([
  'usage',
  'entry',
  'ua',
  'off',
]);

export const AssetsRetryOptionsSchema: ZodType<AssetsRetryOptions> =
  z.partialObj({
    max: z.number(),
    type: z.array(z.string()),
    test: z.union([z.string(), z.function(z.tuple([z.string()]), z.boolean())]),
    domain: z.array(z.string()),
    crossOrigin: z.boolean(),
    onFail: z.function(),
    onRetry: z.function(),
    onSuccess: z.function(),
  });

export const DataUriLimitSchema: ZodType<DataUriLimit> = z.partialObj({
  svg: z.number(),
  font: z.number(),
  image: z.number(),
  media: z.number(),
});

export const LegalCommentsSchema: ZodType<LegalComments> = z.literals([
  'none',
  'inline',
  'linked',
]);

export const DisableSourceMapOptionSchema: ZodType<DisableSourceMapOption> =
  z.union([z.boolean(), z.partialObj({ js: z.boolean(), css: z.boolean() })]);

export const SvgDefaultExportSchema: ZodType<SvgDefaultExport> = z.literals([
  'component',
  'url',
]);

export const sharedOutputConfigSchema = z.partialObj({
  distPath: DistPathConfigSchema,
  filename: FilenameConfigSchema,
  charset: CharsetSchema,
  polyfill: PolyfillSchema,
  assetsRetry: AssetsRetryOptionsSchema,
  assetPrefix: z.string(),
  dataUriLimit: z.union([z.number(), DataUriLimitSchema]),
  legalComments: LegalCommentsSchema,
  cleanDistPath: z.boolean(),
  cssModuleLocalIdentName: z.string(),
  disableCssExtract: z.boolean(),
  disableMinimize: z.boolean(),
  disableSourceMap: DisableSourceMapOptionSchema,
  disableTsChecker: z.boolean(),
  disableFilenameHash: z.boolean(),
  disableInlineRuntimeChunk: z.boolean(),
  disableCssModuleExtension: z.boolean(),
  enableAssetManifest: z.boolean(),
  enableAssetFallback: z.boolean(),
  enableLatestDecorators: z.boolean(),
  enableCssModuleTSDeclaration: z.boolean(),
  enableInlineScripts: z.boolean(),
  enableInlineStyles: z.boolean(),
  overrideBrowserslist: z.union([
    z.array(z.string()),
    z.record(BuilderTargetSchema, z.array(z.string())),
  ]),
  svgDefaultExport: SvgDefaultExportSchema,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedOutputConfig> = sharedOutputConfigSchema;
