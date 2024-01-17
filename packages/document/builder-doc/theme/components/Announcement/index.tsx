import { useLang } from 'rspress/runtime';

export function Announcement() {
  const lang = useLang();

  return (
    <div
      style={{
        height: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(59 130 246 / 0.5)',
      }}
    >
      <a
        href="https://rsbuild.dev/"
        target="_blank"
        rel="noopener noreferrer "
        style={{
          textDecorationLine: 'underline',
          fontWeight: 700,
          color: 'rgb(55 65 81)',
        }}
      >
        {lang === 'zh'
          ? 'Modern.js builder 已升级为 Rsbuild, 欢迎使用 Rsbuild 👏🏻'
          : 'Modern.js builder has been upgraded to Rsbuild, welcome to use Rsbuild 👏🏻'}
      </a>
    </div>
  );
}
