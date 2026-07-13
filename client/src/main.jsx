import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';
import { AuthProvider } from './lib/AuthContext.jsx';
import { SettingsProvider } from './lib/SettingsContext.jsx';
import { BusinessTypeProvider } from './lib/BusinessTypeContext.jsx';
import './styles/index.css';
import './components/ui/ui.css';
import './components/layout/layout.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/app">
      <ToastProvider>
        <AuthProvider>
          <BusinessTypeProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </BusinessTypeProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
