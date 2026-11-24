const paths = {
  refresh: 'M17 8a7 7 0 1 0 .1 5M17 3v5h-5',
  code: 'm7 5-5 5 5 5m6-10 5 5-5 5m-2-12-2 14',
  play: 'm6 3 11 7-11 7z',
  pause: 'M6 3v14M14 3v14',
  plus: 'M10 3v14M3 10h14',
  trash: 'M3 5h14M7 5V2h6v3M5 5l1 13h8l1-13M8 8v7m4-7v7',
  inspect: 'M2 2h6v6H2zM12 2h6v6h-6zM2 12h6v6H2zM12 12h6v6h-6z',
  download: 'M10 2v11m-4-4 4 4 4-4M3 13v5h14v-5',
  memory: 'M5 4h10v12H5zM8 7v6m4-6v6M2 6h3m-3 4h3m-3 4h3m10-8h3m-3 4h3m-3 4h3',
  stop: 'M4 4h12v12H4z',
  browser: 'M2 3h16v14H2zM2 7h16M5 5h.1M8 5h.1',
  server: 'M3 2h14v6H3zM3 12h14v6H3zM6 5h1m-1 10h1',
};
export function LabIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      className="lab-icon"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
