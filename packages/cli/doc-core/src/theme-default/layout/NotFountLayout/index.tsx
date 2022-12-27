import { usePageData } from '@/runtime';

export function NotFoundLayout() {
  const { siteData } = usePageData();
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
      <h1 pt="3" text="xl" leading-5="" font="bold">
        PAGE NOT FOUND
      </h1>
      <div
        m="t-6 x-auto b-4.5"
        w="16"
        style={{ height: '1px' }}
        bg="divider-default"
      />

      <div pt="5">
        <a
          inline-block=""
          border="1px solid brand"
          rounded="2xl"
          p="y-1 x-4"
          text="sm brand"
          font-medium=""
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
