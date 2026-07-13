import { useEffect, useState } from 'react';
import { Package, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { LowStockBanner } from './LowStockBanner.jsx';
import { StockItemForm } from './StockItemForm.jsx';
import { StockTransactionModal } from './StockTransactionModal.jsx';
import './inventory.css';

export function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [txItem, setTxItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const toast = useToast();

  async function loadItems() {
    setLoading(true);
    try {
      setItems(await api.get('/inventory'));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openAdd() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSubmitItem(payload) {
    try {
      if (editingItem) {
        const updated = await api.patch(`/inventory/${editingItem.id}`, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast('Item updated', 'success');
      } else {
        const created = await api.post('/inventory', payload);
        setItems((prev) => [...prev, created]);
        toast('Item added', 'success');
      }
      setFormOpen(false);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.name}" from inventory?`)) return;
    try {
      await api.del(`/inventory/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast('Item deleted', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function openTransactions(item) {
    setTxItem(item);
    try {
      setTransactions(await api.get(`/inventory/${item.id}/transactions`));
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleSubmitTransaction(payload) {
    try {
      const updated = await api.post(`/inventory/${txItem.id}/transactions`, payload);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setTxItem(updated);
      setTransactions(await api.get(`/inventory/${updated.id}/transactions`));
      toast('Stock updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const lowStockCount = items.filter((i) => i.current_stock <= i.low_stock_threshold).length;

  return (
    <div>
      <div className="page-toolbar">
        <p style={{ color: 'var(--color-text-muted)' }}>{items.length} tracked ingredients</p>
        <Button onClick={openAdd}>+ Add item</Button>
      </div>

      <LowStockBanner count={lowStockCount} />

      {loading ? (
        <div className="inventory-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="64px" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title="No inventory items yet" description="Track ingredients and stock levels here." />
      ) : (
        <>
          <div className="inventory-header-row">
            <span>Item</span>
            <span>Current stock</span>
            <span>Threshold</span>
            <span>Status</span>
            <span />
          </div>
          <div className="inventory-list">
            {items.map((item) => {
              const isLow = item.current_stock <= item.low_stock_threshold;
              return (
                <Card key={item.id} tight className="inventory-row">
                  <div className="inventory-row-name">{item.name}</div>
                  <div className="tabular-nums">
                    {item.current_stock} {item.unit}
                  </div>
                  <div className="tabular-nums">
                    {item.low_stock_threshold} {item.unit}
                  </div>
                  <div>
                    <Badge variant={isLow ? 'warning' : 'success'}>{isLow ? 'Low stock' : 'OK'}</Badge>
                  </div>
                  <div className="inventory-row-actions">
                    <Button size="sm" variant="secondary" onClick={() => openTransactions(item)}>
                      Adjust stock
                    </Button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(item)} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(item)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? 'Edit inventory item' : 'Add inventory item'}>
        <StockItemForm
          initialValues={editingItem}
          submitLabel={editingItem ? 'Save changes' : 'Add item'}
          onSubmit={handleSubmitItem}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal open={!!txItem} onClose={() => setTxItem(null)} title={txItem ? `Adjust stock — ${txItem.name}` : ''}>
        {txItem && (
          <StockTransactionModal
            item={txItem}
            transactions={transactions}
            onSubmit={handleSubmitTransaction}
            onCancel={() => setTxItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}
