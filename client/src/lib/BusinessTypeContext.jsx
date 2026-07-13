import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './apiClient.js';
import { useAuth } from './AuthContext.jsx';
import { useSettings } from './SettingsContext.jsx';

const BusinessTypeContext = createContext(null);

const FALLBACK_BUSINESS_TYPE = {
  key: 'restaurant',
  label: 'Restaurant',
  productNoun: { singular: 'Menu Item', plural: 'Menu' },
  orderNoun: 'Orders',
  tableNoun: 'Tables',
  showSeats: true,
  productFields: [{ key: 'food_type', label: 'Food Type', type: 'select', options: ['veg', 'non_veg', 'egg'] }],
};

export function BusinessTypeProvider({ children }) {
  const [businessTypes, setBusinessTypes] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api
      .get('/business-types')
      .then(setBusinessTypes)
      .catch(() => setBusinessTypes([]));
  }, [user]);

  return (
    <BusinessTypeContext.Provider value={{ businessTypes: businessTypes ?? [], loading: businessTypes === null }}>
      {children}
    </BusinessTypeContext.Provider>
  );
}

export function useBusinessTypes() {
  return useContext(BusinessTypeContext);
}

export function useCurrentBusinessType() {
  const { businessTypes } = useBusinessTypes();
  const { settings } = useSettings();
  const key = settings?.business_type;
  return businessTypes.find((bt) => bt.key === key) ?? FALLBACK_BUSINESS_TYPE;
}
