export const ports = JSON.parse(process.env.MF_LAB_PORTS || '{}') as Record<
  string,
  number
>;
export const port = (name: string, fallback: number) => ports[name] || fallback;
export const origin = (name: string, fallback: number) =>
  `http://localhost:${port(name, fallback)}`;
export const shared = {
  react: { singleton: true },
  'react-dom': { singleton: true },
};
