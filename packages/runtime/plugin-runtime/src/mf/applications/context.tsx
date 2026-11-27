import { createContext, useContext } from 'react';
import type { ApplicationsService } from './types';

export const ApplicationsReactContext = createContext<
  ApplicationsService | undefined
>(undefined);

/** Access the current application's dynamic discovery service inside components. */
export function useApplications(): ApplicationsService {
  const service = useContext(ApplicationsReactContext);
  if (!service) {
    throw new Error(
      'useApplications() requires moduleFederation.applications to be enabled.',
    );
  }
  return service;
}
