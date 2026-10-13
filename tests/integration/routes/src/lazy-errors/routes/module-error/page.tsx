export default function Page() {
  return <div>This route must never render</div>;
}

// Fail while evaluating the imported module, before React renders the page.
throw Object.assign(new Error('Route module initialization failed'), {
  code: 'ROUTE_MODULE_INIT_FAILED',
});
