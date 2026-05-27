import { createContext, type PropsWithChildren, useContext } from 'react';
import { theme, type AppTheme } from '../styles';

interface AppContextValue {
  appName: string;
  theme: AppTheme;
}

const appContextValue: AppContextValue = {
  appName: 'DADN Mobile',
  theme,
};

const AppContext = createContext<AppContextValue>(appContextValue);

export function AppContextProvider({ children }: PropsWithChildren) {
  return <AppContext.Provider value={appContextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
