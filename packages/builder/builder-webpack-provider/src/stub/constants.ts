export const STUB_BUILDER_PLUGIN_BUILTIN =
  (
    {
      true: true,
      false: false,
      default: 'default',
      minimal: 'minimal',
    } as const
  )[process.env.STUB_BUILDER_PLUGIN_BUILTIN || ''] || undefined;
