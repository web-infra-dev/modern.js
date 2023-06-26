import { usePageData } from '@/runtime';

export function NotFoundLayout() {
  const { siteData } = usePageData();
  const defaultLang = siteData.lang;
  // Consider the existing sites include the defaultLang in some links, such as '/zh/guide/quick-start'
  // We need to redirect them to '/guide/quick-start'
  // In the meanwhile, we will not show the 404 page for the user experience
  if (
    defaultLang &&
    typeof window !== 'undefined' &&
    location.pathname.includes(`/${defaultLang}/`)
  ) {
    const redirectUrl = location.pathname.replace(`/${defaultLang}/`, '/');
    window.location.replace(redirectUrl);
    return <></>;
  } else {
    // The 404 page content
    return (
      <div className="m-auto mt-50 p-16 sm:p-8 sm:pt-24 sm:pb-40 text-center flex-center flex-col">
        <p className="text-6xl font-semibold">404</p>
        <h1 className="leading-5 pt-3 text-xl font-bold">PAGE NOT FOUND</h1>
        <div
          style={{ height: '1px' }}
          className="mt-6 mx-auto mb-4.5 w-16 bg-gray-light-1"
        />

        <div className="pt-5">
          <a
            className="py-2 px-4 rounded-2xl inline-block border-solid border-brand text-brand font-medium hover:border-brand-dark hover:text-brand-dark transition-colors duration-300"
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
