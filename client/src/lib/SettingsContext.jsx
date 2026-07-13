import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './apiClient.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSettings(null);
      return;
    }
    api
      .get('/settings')
      .then(setSettings)
      .catch(() => {});
  }, [user]);

  const updateSettings = useCallback(async (partial) => {
    const updated = await api.patch('/settings', partial);
    setSettings(updated);
    return updated;
  }, []);

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
