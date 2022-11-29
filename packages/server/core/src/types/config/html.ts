export interface HtmlUserConfig {
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
}

export type HtmlNormalizedConfig = HtmlUserConfig;
