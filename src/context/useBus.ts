import { useContext } from 'react';
import { BusContext } from './BusContext';
import type { BusContextType } from './BusContextValue';

export const useBus = (): BusContextType => {
  const context = useContext(BusContext);
  if (!context) {
    throw new Error('useBus must be used within BusProvider');
  }
  return context;
};
