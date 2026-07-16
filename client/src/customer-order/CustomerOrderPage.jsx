import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { useToast } from '../components/ui/ToastContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatCurrency } from '../lib/format.js';

const STATUS_VARIANT = { pending: 'warning', approved: 'success', rejected: 'danger' };

function getTokenFromPath() {
  // expects /order/:token
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[1] ?? '';
}

export function CustomerOrderPage() {
  const token = useMemo(getTokenFromPath, []);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);

  const load = useCallback(async () => {
    try {
      setData(await api.get(`/public/tables/${token}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshRequests = useCallback(async () => {
    try {
      setRequests(await api.get(`/public/tables/${token}/requests`));
    } catch {
      // silent — this is a background poll, not a user action
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data || data.restaurant_suspended) return;
    refreshRequests();
    const interval = setInterval(refreshRequests, 5000);
    return () => clearInterval(interval);
  }, [data, refreshRequests]);

  if (loading) {
    return (
      <div className="customer-order-shell">
        <p className="customer-order-message">Loading menu…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="customer-order-shell">
        <p className="customer-order-message">This QR code isn't valid. Please ask a staff member for help.</p>
      </div>
    );
  }

  if (data.restaurant_suspended) {
    return (
      <div className="customer-order-shell">
        <p className="customer-order-message">This restaurant isn't accepting orders right now.</p>
      </div>
    );
  }

  if (data.table_status === 'locked') {
    return (
      <div className="customer-order-shell">
        <p className="customer-order-message">This table is currently locked. Please ask a staff member for help.</p>
      </div>
    );
  }

  const { categories, products } = data;
  const visibleProducts = activeCategory ? products.filter((p) => p.category_id === activeCategory) : products;

  function updateQuantity(productId, delta) {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[productId] ?? 0) + delta;
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  const cartEntries = Object.entries(cart);
  const cartCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);
  const cartTotal = cartEntries.reduce((sum, [id, qty]) => {
    const product = products.find((p) => String(p.id) === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  async function handleSubmit() {
    if (cartEntries.length === 0) return;
    setSubmitting(true);
    try {
      for (const [productId, quantity] of cartEntries) {
        await api.post(`/public/tables/${token}/requests`, { product_id: Number(productId), quantity });
      }
      setCart({});
      toast('Sent to staff for confirmation', 'success');
      refreshRequests();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="customer-order-shell">
      <div className="customer-order-header">
        <div className="customer-order-restaurant">{data.restaurant_name}</div>
        <div className="customer-order-table">{data.table_label}</div>
      </div>

      <div className="customer-order-category-tabs">
        <button
          className={`category-pill${activeCategory === null ? ' active' : ''}`}
          onClick={() => setActiveCategory(null)}
          type="button"
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`category-pill${activeCategory === c.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
            type="button"
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="customer-order-menu-list">
        {visibleProducts.map((item) => {
          const qty = cart[item.id] ?? 0;
          return (
            <Card key={item.id} tight className="customer-order-menu-item">
              <div className="customer-order-menu-item-info">
                <div className="customer-order-menu-item-name">{item.name}</div>
                {item.description && <div className="customer-order-menu-item-desc">{item.description}</div>}
                <div className="tabular-nums customer-order-menu-item-price">{formatCurrency(item.price)}</div>
              </div>
              <div className="qty-stepper">
                <button type="button" onClick={() => updateQuantity(item.id, -1)} disabled={qty === 0}>
                  −
                </button>
                <span className="tabular-nums">{qty}</span>
                <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                  +
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {requests.length > 0 && (
        <div className="customer-order-requests">
          <div className="customer-order-section-title">Your requests</div>
          {requests.map((r) => (
            <div key={r.id} className="customer-order-request-row">
              <span>
                {r.item_name_snapshot} × {r.quantity}
              </span>
              <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {cartCount > 0 && (
        <div className="customer-order-cart-bar">
          <div>
            <div className="customer-order-cart-count">
              {cartCount} item{cartCount === 1 ? '' : 's'}
            </div>
            <div className="tabular-nums">{formatCurrency(cartTotal)}</div>
          </div>
          <Button loading={submitting} onClick={handleSubmit}>
            Send to staff
          </Button>
        </div>
      )}
    </div>
  );
}
