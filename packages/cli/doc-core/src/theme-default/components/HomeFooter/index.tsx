import { usePageData } from '@/runtime';

export function Footer() {
  const { siteData } = usePageData();
  const { message } = siteData.themeConfig.footer || {};
  return (
    <footer
      m="t-12"
      p="y-8 x-6 sm:8"
      w="full"
      border="t-1 b-0 solid divider-light"
      className="absolute bottom-0"
    >
      <div m="auto" w="full" text="center">
        {message && (
          <div font="medium" text="sm text-2">
            {message}
          </div>
        )}
      </div>
    </footer>
  );
}
