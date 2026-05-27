import { createContext, type PropsWithChildren, useContext } from 'react';

interface AppContextValue {
  appName: string;
}

const AppContext = createContext<AppContextValue>({ appName: 'DADN Rooms' });

export function AppContextProvider({ children }: PropsWithChildren) {
  return <AppContext.Provider value={{ appName: 'DADN Rooms' }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
