import { SidebarItem } from '../../shared/types/default-theme';
import { DocPlugin, SidebarGroup, NavItem, DocConfig } from '@/shared/types';

// The plugin is used to replace the text in the nav and sidebar config
export function replacePlugin(): DocPlugin {
  let docConfig: DocConfig;
  return {
    name: 'replace-plugin',
    config(c) {
      docConfig = c;
      const { replaceRules = [], themeConfig } = docConfig;
      const locales = themeConfig?.locales || [];
      const nav = locales
        ? (locales.map(locale => locale.nav).flat() as NavItem[])
        : themeConfig?.nav ?? [];
      const sidebar = locales
        ? locales.reduce((sidebar, locale) => {
            return {
              ...sidebar,
              ...locale.sidebar,
            };
          }, {})
        : themeConfig?.sidebar ?? {};
      if (nav?.length) {
        // Replace nav config
        nav.forEach(navItem => {
          navItem.text = replaceRules.reduce((text, rule) => {
            return text.replace(rule.search, rule.replace);
          }, navItem.text || '');
        });
      }
      // Replace sidebar config
      const traverseSidebar = (
        sidebarItem: SidebarGroup | SidebarItem,
      ): void => {
        if ('items' in sidebarItem) {
          sidebarItem.items.forEach(item => {
            traverseSidebar(item);
          });
        }
        if (sidebarItem.text) {
          sidebarItem.text = replaceRules.reduce((text, rule) => {
            return text.replace(rule.search, rule.replace);
          }, sidebarItem.text || '');
        }
      };
      (Object.values(sidebar).flat() as (SidebarGroup | SidebarItem)[]).forEach(
        sidebarItem => {
          traverseSidebar(sidebarItem);
        },
      );
      return docConfig;
    },
  };
}
