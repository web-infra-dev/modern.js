// legacy withRouter

import {
  useLocation,
  useNavigate,
  useParams,
} from '@modern-js/runtime-utils/router';
import type React from 'react';

export interface WithRouterProps {
  location: ReturnType<typeof useLocation>;
  params: Record<string, string>;
  navigate: ReturnType<typeof useNavigate>;
}

export const withRouter = <Props extends WithRouterProps>(
  Component: React.ComponentType<Props>,
) => {
  return (props: Omit<Props, keyof WithRouterProps>) => {
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();
    return (
      <Component
        {...(props as Props)}
        location={location}
        params={params}
        navigate={navigate}
      />
    );
  };
};
