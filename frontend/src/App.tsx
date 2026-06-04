import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router';
import { ToastContainer } from 'react-toastify';
import { AppContextProvider } from './contexts';
import { ThemeProvider, useTheme } from './contexts/theme-context';
import AppRoutes from './routes';
import './App.css';

// Reads useTheme() → must render inside <ThemeProvider>
function AntdConfig({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary:     '#4f46e5',
          colorBgBase:      isDark ? '#0b1326' : '#f0f2f8',
          colorBgContainer: isDark ? '#171f33' : '#ffffff',
          colorBorder:      isDark ? '#464555' : '#c4c6d4',
          colorText:        isDark ? '#dae2fd' : '#1a1c2e',
          colorTextSecondary: isDark ? '#c7c4d8' : '#44475a',
          borderRadius:     4,
          fontFamily:       "'Inter', system-ui, sans-serif",
          fontSize:         14,
        },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AntdConfig>
        <AppContextProvider>
          <RouterProvider router={AppRoutes} />
          <ToastContainer position="top-right" autoClose={2500} />
        </AppContextProvider>
      </AntdConfig>
    </ThemeProvider>
  );
}

export default App;
