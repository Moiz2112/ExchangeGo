import { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

