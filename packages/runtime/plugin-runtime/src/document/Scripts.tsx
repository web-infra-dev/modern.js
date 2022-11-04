export const ChunkScriptsPlaceHolder = encodeURIComponent(
  '<!-- chunk scripts placeholder -->',
);

export function Scripts() {
  return <>{`${ChunkScriptsPlaceHolder}`}</>;
}
