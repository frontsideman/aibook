'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type HeaderContextType = {
  header: ReactNode | null;
  setHeader: (header: ReactNode | null) => void;
};

const HeaderContext = createContext<HeaderContextType | null>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<ReactNode | null>(null);
  return <HeaderContext.Provider value={{ header, setHeader }}>{children}</HeaderContext.Provider>;
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
