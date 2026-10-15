import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const STORAGE_THEME_KEY = 'lemoguide_admin_dark_mode';
const STORAGE_SIDEBAR_STYLE_KEY = 'lemoguide_admin_sidebar_style';
const STORAGE_SIDEBAR_COLLAPSED_KEY = 'lemoguide_admin_sidebar_collapsed';

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_THEME_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarStyle, setSidebarStyle] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_SIDEBAR_STYLE_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, darkMode ? 'true' : 'false');
      if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SIDEBAR_STYLE_KEY, sidebarStyle);
    } catch (e) {
      console.error(e);
    }
  }, [sidebarStyle]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [collapsed]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        sidebarStyle,
        setSidebarStyle,
        collapsed,
        setCollapsed,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
