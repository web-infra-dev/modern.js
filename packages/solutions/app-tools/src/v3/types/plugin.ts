import type { Plugin } from '@modern-js/plugin-v2';

// TODO add string plugin and old plugin support
// export type PluginItem = string | [string, any];

// /**
//  * @deprecated
//  * Using NewPluginConfig instead.
//  */
// export type OldPluginConfig = Array<PluginItem>;

/**
 * The type of PluginOptions is looser than the actual type,
 * this avoids potential type mismatch issues when using different version plugins.
 */
export type NewPluginConfig = Plugin[];

// export type PluginConfig = OldPluginConfig | NewPluginConfig;
