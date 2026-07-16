import React from 'react';
import ReactDOM from 'react-dom/client';
import { CustomerOrderPage } from './CustomerOrderPage.jsx';
import { ToastProvider } from '../components/ui/ToastContext.jsx';
import '../styles/index.css';
import '../components/ui/ui.css';
import './customer-order.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <CustomerOrderPage />
    </ToastProvider>
  </React.StrictMode>
);
