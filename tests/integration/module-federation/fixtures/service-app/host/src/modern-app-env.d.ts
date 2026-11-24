/// <reference types='@modern-js/app-tools/types' />
declare module 'provider/ServiceWeatherApplication' {
  const provider: import('@module-federation/bridge-react/base').BridgeProvider<{
    label?: string;
  }>;
  export default provider;
}
