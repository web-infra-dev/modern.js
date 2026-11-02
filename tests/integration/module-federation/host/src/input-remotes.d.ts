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
