import { defineRoutes } from '@modern-js/runtime/config-routes';

export default defineRoutes(({ page }, fileRoutes) => {
  // Scenario 1: Config routes override conventional routes
  // The 'shop' route overrides conventional routes/shop/page.tsx
  const shopPageIndex = fileRoutes[0].children?.findIndex(
    route => route.id === 'three_shop/page',
  );
  fileRoutes[0].children?.splice(shopPageIndex!, 1);
  fileRoutes[0].children?.push(page('routes/CustomShop.tsx', 'shop'));

  // Scenario 2: Config routes supplement conventional routes
  // 'settings' is config-only, no conventional counterpart
  fileRoutes[0].children?.push(page('routes/Settings.tsx', 'settings'));

  // Scenario 3: Mixed nested routes
  // Add a config child route under the conventional 'user' layout
  const userRoute = fileRoutes[0].children?.find(
    (route: any) => route.path === 'user',
  );
  if (userRoute?.children) {
    userRoute.children.push(page('routes/user/CustomTab.tsx', 'custom-tab'));
  }

  // Scenario 4: Auto-discovery of companion files for config route
  // Product.tsx auto-discovers Product.data.ts and Product.error.tsx
  fileRoutes[0].children?.push(page('routes/Product.tsx', 'product/:id'));

  return fileRoutes;
});
