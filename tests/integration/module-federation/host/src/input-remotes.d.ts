declare module 'provider/InputCard' {
  import type { ComponentType } from 'react';
  export interface InputCardProps {
    label: string;
    instance: string;
  }
  const InputCard: ComponentType<InputCardProps>;
  export default InputCard;
}

declare module 'provider/Forecast' {
  import type { ComponentType } from 'react';
  const Forecast: ComponentType<{ id?: string }>;
  export default Forecast;
}

declare module 'provider/ProductApp' {
  import type { BridgeProvider } from '@module-federation/bridge-react/base';
  const ProductApp: BridgeProvider<{ label?: string }>;
  export default ProductApp;
}

declare module 'provider/AirQualityApp' {
  import type { BridgeProvider } from '@module-federation/bridge-react/base';
  const App: BridgeProvider<{ label?: string }>;
  export default App;
}

declare module 'provider/WeatherForecastApp' {
  import type { BridgeProvider } from '@module-federation/bridge-react/base';
  const App: BridgeProvider<{ label?: string }>;
  export default App;
}
