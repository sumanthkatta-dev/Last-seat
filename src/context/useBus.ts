import { useContext } from 'react';
import { BusContext } from './BusContext';

export const useBus = () => {
  const context = useContext(BusContext);
  if (!context) {
    throw new Error('useBus must be used within BusProvider');
  }
  return context;
};
