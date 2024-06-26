export type CrossOrigin = 'anonymous' | 'use-credentials';

export type ScriptLoading = 'defer' | 'module' | 'blocking';

export interface HtmlUserConfig {
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
  /**
   * Set the [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) attribute
   * of the `<script>` tag.
   */
  crossorigin?: boolean | CrossOrigin;

  /**
   * Set the loading mode of the `<script>` tag.
   */
  scriptLoading?: ScriptLoading;
}

export type HtmlNormalizedConfig = HtmlUserConfig;
