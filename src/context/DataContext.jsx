import { createContext, useContext } from 'react';

export const DataContext = createContext();

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext debe ser usado dentro de un DataProvider');
  }
  return context;
};