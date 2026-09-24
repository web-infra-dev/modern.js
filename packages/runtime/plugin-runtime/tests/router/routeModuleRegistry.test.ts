import { createMemoryRouter } from '@modern-js/runtime-utils/router';
import { createRouteModuleRegistry } from '../../src/router/runtime/routerHelper';

it('keeps same-ID route revalidation policies independent across application routers', async () => {
  const products = createRouteModuleRegistry();
  const inventory = createRouteModuleRegistry();
  const productPolicy = products.createShouldRevalidate('page');
  const inventoryPolicy = inventory.createShouldRevalidate('page');
  let productLoads = 0;
  let inventoryLoads = 0;
  const decisions: string[] = [];
  const productModule = {
    shouldRevalidate: () => {
      decisions.push('products');
      return false;
    },
  };
  expect(products.handleRouteModule(productModule, 'page')).toBe(productModule);
  // A second application loads the same route ID after the first application.
  inventory.handleRouteModule(
    {
      shouldRevalidate: () => {
        decisions.push('inventory');
        return true;
      },
    },
    'page',
  );
  const productRouter = createMemoryRouter(
    [
      {
        id: 'page',
        path: '/',
        loader: () => ++productLoads,
        shouldRevalidate: productPolicy,
      },
    ],
    { hydrationData: { loaderData: { page: 'product-ssr' } } },
  );
  const inventoryRouter = createMemoryRouter(
    [
      {
        id: 'page',
        path: '/',
        loader: () => ++inventoryLoads,
        shouldRevalidate: inventoryPolicy,
      },
    ],
    { hydrationData: { loaderData: { page: 'inventory-ssr' } } },
  );
  try {
    await Promise.all([
      productRouter.navigate('/?page=2'),
      inventoryRouter.navigate('/?page=2'),
    ]);
    expect(productLoads).toBe(0);
    expect(inventoryLoads).toBe(1);
    expect(decisions.sort()).toEqual(['inventory', 'products']);
    expect(productRouter.state.loaderData.page).toBe('product-ssr');
    expect(inventoryRouter.state.loaderData.page).toBe(1);
  } finally {
    productRouter.dispose();
    inventoryRouter.dispose();
  }
});

it('uses the router default until its own route module provides a policy', () => {
  const first = createRouteModuleRegistry();
  const second = createRouteModuleRegistry();
  const policy = first.createShouldRevalidate('page');
  const args = {
    currentUrl: new URL('http://host/'),
    nextUrl: new URL('http://host/?page=2'),
    currentParams: {},
    nextParams: {},
    defaultShouldRevalidate: true,
  };
  second.handleRouteModule({ shouldRevalidate: () => false }, 'page');
  expect(policy(args)).toBe(true);
  expect(policy({ ...args, defaultShouldRevalidate: false })).toBe(false);
  first.handleRouteModule({ shouldRevalidate: () => false }, 'page');
  expect(policy(args)).toBe(false);
});
