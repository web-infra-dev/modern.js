import { HeadConfig } from '.';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DefaultTheme {
  export interface Config {
    /**
     * Whether to enable dark mode.
     * @default true
     */
    darkMode?: boolean;
    /**
     * Custom outline title in the aside component.
     *
     * @default 'On this page'
     */
    outlineTitle?: string;
    /**
     * Whether to show the sidebar in right position.
     */
    outline?: boolean;
    /**
     * The nav items.
     */
    nav?: NavItem[];

    /**
     * The sidebar items.
     */
    sidebar?: Sidebar;

    /**
     * Info for the edit link. If it's undefined, the edit link feature will
     * be disabled.
     */
    editLink?: EditLink;

    /**
     * Set custom last updated text.
     *
     * @default 'Last updated'
     */
    lastUpdatedText?: string;

    /**
     * Set custom prev/next labels.
     */
    docFooter?: DocFooter;

    /**
     * The social links to be displayed at the end of the nav bar. Perfect for
     * placing links to social services such as GitHub, Twitter, Facebook, etc.
     */
    socialLinks?: SocialLink[];

    /**
     * The footer configuration.
     */
    footer?: Footer;
    /**
     * The prev page text.
     */
    prevPageText?: string;
    /**
     * The next page text.
     */
    nextPageText?: string;
    /**
     * Locale config
     */
    locales?: Record<string, LocaleConfig>;
    /**
     * Whether to open the full text search
     */
    search?: boolean;
    /**
     * Whether to use back top
     */
    backTop?: boolean;
  }

  /**
   * locale config
   */
  export interface LocaleConfig {
    lang?: string;
    title?: string;
    langRoutePrefix?: string;
    description?: string;
    head?: HeadConfig[];
    label: string;
    selectText?: string;
    nav?: NavItem[];
    sidebar?: Sidebar;
    outlineTitle?: string;
    lastUpdatedText?: string;
    editLink?: EditLink;
    prevPageText?: string;
    nextPageText?: string;
  }
  // nav -----------------------------------------------------------------------

  export type NavItem = NavItemWithLink | NavItemWithChildren;

  export type NavItemWithLink = {
    text: string;
    link: string;
  };

  export type NavItemChildren = {
    text?: string;
    items: NavItemWithLink[];
  };

  export interface NavItemWithChildren {
    text?: string;
    items: NavItemWithLink[];
  }

  // image -----------------------------------------------------------------------
  export type Image = string | { src: string; alt?: string };

  // sidebar -------------------------------------------------------------------
  export interface Sidebar {
    [path: string]: SidebarGroup[];
  }

  export interface SidebarGroup {
    text?: string;
    items: SidebarItem[];
  }

  export type SidebarItem =
    | { text: string; link: string }
    | { text: string; link?: string; items: SidebarItem[] };

  // edit link -----------------------------------------------------------------

  export interface EditLink {
    /**
     * Pattern for edit link.
     *
     * @example 'https://github.com/vuejs/vitepress/edit/main/docs/:path'
     */
    pattern: string;

    /**
     * Custom text for edit link.
     *
     * @default 'Edit this page'
     */
    text?: string;
  }

  // prev-next -----------------------------------------------------------------

  export interface DocFooter {
    /**
     * Custom label for previous page button.
     *
     * @default 'Previous page'
     */
    prev?: SidebarItem;

    /**
     * Custom label for next page button.
     *
     * @default 'Next page'
     */
    next?: SidebarItem;
  }

  // social link ---------------------------------------------------------------

  export interface SocialLink {
    icon: SocialLinkIcon;
    mode: 'link' | 'text' | 'img';
    content: string;
  }

  export type SocialLinkIcon =
    | 'discord'
    | 'facebook'
    | 'github'
    | 'instagram'
    | 'linkedin'
    | 'slack'
    | 'twitter'
    | 'youtube'
    | 'weixin'
    | 'qq'
    | 'juejin'
    | 'zhihu'
    | 'bilibili'
    | 'weibo'
    | { svg: string };

  // footer --------------------------------------------------------------------

  export interface Footer {
    message?: string;
  }

  // locales -------------------------------------------------------------------

  export interface LocaleLinks {
    text: string;
    items: LocaleLink[];
  }

  export interface LocaleLink {
    text: string;
    link: string;
  }

  export type BackTopOptions =
    | boolean
    | {
        visibleHeight?: number;
        duration?: number;
        animation?: BackTopAnimation;
      };

  export type BackTopAnimation =
    | 'linear'
    | 'quadIn'
    | 'quadOut'
    | 'quadInOut'
    | 'cubicIn'
    | 'cubicOut'
    | 'cubicInOut'
    | 'quartIn'
    | 'quartOut'
    | 'quartInOut'
    | 'quintIn'
    | 'quintOut'
    | 'quintInOut'
    | 'sineIn'
    | 'sineOut'
    | 'sineInOut'
    | 'bounceIn'
    | 'bounceOut'
    | 'bounceInOut';
}
