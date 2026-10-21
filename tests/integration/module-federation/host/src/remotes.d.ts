declare module 'provider/Signal' {
  const Component: import('react').ComponentType<{ id?: string }>;
  export default Component;
}
declare module 'nested/Relay' {
  const Component: import('react').ComponentType;
  export default Component;
}
declare module 'provider/Forecast' {
  const Component: (props: {
    id?: string;
    mfData?: {
      source: string;
      temperature: number;
      weather?: 'sunny' | 'rainy';
    };
  }) => import('react').JSX.Element;
  export default Component;
}
declare module 'provider/ClientRecovery' {
  const Component: import('react').ComponentType<{
    mfData?: { source: string };
  }>;
  export default Component;
}
declare module 'provider/ServerRecovery' {
  const Component: import('react').ComponentType<{
    mfData?: { source: string };
  }>;
  export default Component;
}
declare module 'library/Forecast' {
  const Component: (props: {
    id?: string;
    mfData?: {
      source: string;
      temperature: number;
      weather?: 'sunny' | 'rainy';
    };
  }) => import('react').JSX.Element;
  export default Component;
}
declare module 'library/NoData' {
  const Component: import('react').ComponentType;
  export default Component;
}

declare module 'provider/WeatherDays' {
  const Component: import('react').ComponentType;
  export default Component;
}
