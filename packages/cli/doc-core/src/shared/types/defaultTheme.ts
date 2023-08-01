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
   * Set custom last updated text.
   *
   * @default false
   */
  lastUpdated?: boolean;
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
  locales?: LocaleConfig[];
  /**
   * Whether to open the full text search
   */
  search?: boolean;
  /**
   * Whether to use back top
   */
  backTop?: boolean;
  /**
   * Whether to hide the navbar
   */
  hideNavbar?: boolean;
}

/**
 * locale config
 */
export interface LocaleConfig {
  /**
   * Site i18n config, which will recover the locales config in the site level.
   */
  lang: string;
  title?: string;
  description?: string;
  label: string;
  /**
   * Theme i18n config
   */
  nav?: NavItem[];
  sidebar?: Sidebar;
  outlineTitle?: string;
  lastUpdatedText?: string;
  lastUpdated?: boolean;
  editLink?: EditLink;
  prevPageText?: string;
  nextPageText?: string;
  langRoutePrefix?: string;
}
// nav -----------------------------------------------------------------------

export type NavItem = NavItemWithLink | NavItemWithChildren;

export type NavItemWithLink = {
  text: string;
  link: string;
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
};

export interface NavItemWithChildren {
  text?: string;
  tag?: string;
  items: (NavItemWithChildren | NavItemWithLink)[];
  position?: 'left' | 'right';
}

// image -----------------------------------------------------------------------
export type Image = string | { src: string; alt?: string };

// sidebar -------------------------------------------------------------------
export interface Sidebar {
  [path: string]: (SidebarGroup | SidebarItem)[];
}

export interface SidebarGroup {
  text: string;
  link?: string;
  tag?: string;
  items: (SidebarItem | SidebarGroup | string)[];
  collapsible?: boolean;
  collapsed?: boolean;
}

export type SidebarItem = { text: string; link: string; tag?: string };

// edit link -----------------------------------------------------------------

export interface EditLink {
  /**
   * Custom repository url for edit link.
   */
  docRepoBaseUrl: string;

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
   */
  prev?: SidebarItem;

  /**
   * Custom label for next page button.
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
  | 'lark'
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
  | 'gitlab'
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

// normalized config ---------------------------------------------------------
export interface NormalizedSidebarGroup extends Omit<SidebarGroup, 'items'> {
  items: (SidebarItem | NormalizedSidebarGroup)[];
  collapsible: boolean;
  collapsed: boolean;
}
export interface NormalizedSidebar {
  [path: string]: (NormalizedSidebarGroup | SidebarItem)[];
}
export interface NormalizedLocales extends Omit<LocaleConfig, 'sidebar'> {
  sidebar: NormalizedSidebar;
}

export interface NormalizedConfig extends Omit<Config, 'locales' | 'sidebar'> {
  locales: NormalizedLocales[];
  sidebar: NormalizedSidebar;
}
