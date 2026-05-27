import { StatusBar } from 'expo-status-bar';
import { AppContextProvider } from './src/contexts';
import AppRoutes from './src/routes';

export default function App() {
  return (
    <AppContextProvider>
      <StatusBar style="dark" />
      <AppRoutes />
    </AppContextProvider>
  );
}
