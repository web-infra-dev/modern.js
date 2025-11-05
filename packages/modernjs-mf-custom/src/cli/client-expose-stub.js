// Client-only expose stub for Node/SSR builds
// This stub is used when MF_FILTER_CLIENT_EXPOSES=1 to prevent
// accidental execution of client components on the server
export default function ClientOnlyStub() {
  return null;
}
