export default function Page() {
  const flag =
    typeof window === 'undefined'
      ? 'ssr'
      : String((window as any).__pre_entry_flag);
  return <div id="pre-entry-flag">{flag}</div>;
}
