import { usePageData } from '@/runtime';

export function NotFoundLayout() {
  const { siteData } = usePageData();
  const defaultLang = siteData.lang;
  // Consider the existing sites include the defaultLang in some links, such as '/zh/guide/quick-start'
  // We need to redirect them to '/guide/quick-start'
  // In the meanwhile, we will not show the 404 page for the user experience
  if (
    defaultLang &&
    location.pathname.includes(`/${defaultLang}/`) &&
    typeof window !== 'undefined'
  ) {
    const redirectUrl = location.pathname.replace(`/${defaultLang}/`, '/');
    window.location.replace(redirectUrl);
  } else {
    // The 404 page content
    return (
      <div
        m="auto t-50"
        p="t-16 x-6 b-24 sm:t-24 x-8 b-40"
        text="center"
        flex="center col"
      >
        <p text="6xl" font="semibold">
          404
        </p>
        <h1 p="t-3" text="xl" className="leading-5" font="bold">
          PAGE NOT FOUND
        </h1>
        <div
          m="t-6 x-auto b-4.5"
          w="16"
          style={{ height: '1px' }}
          bg="gray-light-1"
        />

        <div p="t-5">
          <a
            inline-block="~"
            border="1px solid brand"
            className="rounded-2xl"
            p="y-2 x-4"
            text="sm brand"
            font-medium="~"
            transition="border-color duration-300 color duration-300"
            hover="border-color-brand-dark color-brand-dark"
            href={siteData.base}
            aria-label="go to home"
          >
            Take me home
          </a>
        </div>
      </div>
    );
  }
}
