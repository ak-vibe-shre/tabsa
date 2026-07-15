import { useEffect, useState } from 'react';
import { UtensilsCrossed, Store, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { usePendingSet } from '../../lib/usePendingSet.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { TableGrid } from './TableGrid.jsx';
import { TableForm } from './TableForm.jsx';
import { OrderBuilder } from './OrderBuilder.jsx';
import { OrderHistory } from './OrderHistory.jsx';
import { formatCurrency } from '../../lib/format.js';
import './pos.css';

export function PosPage() {
  const [tab, setTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null); // { orderId, table }
  const [manageOpen, setManageOpen] = useState(false);
  const [tableFormOpen, setTableFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const toast = useToast();
  const { user } = useAuth();
  const businessType = useCurrentBusinessType();
  const canManageTables = user?.role === 'owner' || user?.role === 'manager';
  const { isPending, withPending } = usePendingSet();

  async function loadAll() {
    setLoading(true);
    try {
      const [tablesData, categoriesData, productsData, openOrders, billedOrders] = await Promise.all([
        api.get('/tables'),
        api.get('/categories'),
        api.get('/products?available=true'),
        api.get('/orders?status=open&pageSize=100'),
        api.get('/orders?status=billed&pageSize=100'),
      ]);
      setTables(tablesData);
      setCategories(categoriesData);
      setProducts(productsData);
      setTakeawayOrders([...openOrders.orders, ...billedOrders.orders].filter((o) => !o.table_id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelectTable = (table) =>
    withPending(`table-${table.id}`, async () => {
      if (table.status === 'available') {
        try {
          const order = await api.post('/orders', { table_id: table.id, order_type: 'dine_in' });
          setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: 'occupied', current_order_id: order.id } : t)));
          setActiveOrder({ orderId: order.id, table: { ...table, status: 'occupied' } });
        } catch (err) {
          toast(err.message, 'error');
        }
      } else if (table.current_order_id) {
        setActiveOrder({ orderId: table.current_order_id, table });
      }
    })();

  const handleNewTakeaway = withPending('new-takeaway', async () => {
    try {
      const order = await api.post('/orders', { order_type: 'takeaway' });
      setActiveOrder({ orderId: order.id, table: null });
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  const handleLockTable = (table) =>
    withPending(`table-${table.id}`, async () => {
      const note = window.prompt(`Lock ${table.label} — add a note (optional):`, '');
      if (note === null) return;
      try {
        const updated = await api.post(`/tables/${table.id}/lock`, { note: note || undefined });
        setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
        toast(`${table.label} locked`, 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleReleaseTable = (table) =>
    withPending(`table-${table.id}`, async () => {
      if (!confirm(`Release ${table.label}?${table.lock_note ? ` (${table.lock_note})` : ''}`)) return;
      try {
        const updated = await api.post(`/tables/${table.id}/release`);
        setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
        toast(`${table.label} released`, 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  function openAddTable() {
    setEditingTable(null);
    setTableFormOpen(true);
  }

  function openEditTable(table) {
    setEditingTable(table);
    setTableFormOpen(true);
  }

  const [tableFormSubmitting, setTableFormSubmitting] = useState(false);

  async function handleSubmitTable(payload) {
    setTableFormSubmitting(true);
    try {
      if (editingTable) {
        const updated = await api.patch(`/tables/${editingTable.id}`, payload);
        setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast('Table updated', 'success');
      } else {
        const created = await api.post('/tables', payload);
        setTables((prev) => [...prev, created]);
        toast('Table added', 'success');
      }
      setTableFormOpen(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setTableFormSubmitting(false);
    }
  }

  async function handleDeleteTable(table) {
    if (!confirm(`Delete "${table.label}"?`)) return;
    await withPending(`table-del-${table.id}`, async () => {
      try {
        await api.del(`/tables/${table.id}`);
        setTables((prev) => prev.filter((t) => t.id !== table.id));
        toast('Table deleted', 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    })();
  }

  return (
    <div>
      <div className="pos-tabs">
        <button className={tab === 'tables' ? 'active' : ''} onClick={() => setTab('tables')}>
          {businessType.tableNoun}
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
History
        </button>
      </div>

      {tab === 'history' ? (
        <OrderHistory />
      ) : (
        <>
          <div className="takeaway-bar">
            <p style={{ color: 'var(--color-text-muted)' }}>
              Tap an available {businessType.tableNoun.slice(0, -1).toLowerCase()} to start an order, or take a walk-in order.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {canManageTables && (
                <Button variant="secondary" onClick={() => setManageOpen(true)}>
                  Manage {businessType.tableNoun.toLowerCase()}
                </Button>
              )}
              <Button onClick={handleNewTakeaway} loading={isPending('new-takeaway')}>
                + New takeaway order
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="table-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height="140px" />
              ))}
            </div>
          ) : tables.length === 0 ? (
            <EmptyState
              icon={businessType.showSeats ? <UtensilsCrossed size={28} /> : <Store size={28} />}
              title={`No ${businessType.tableNoun.toLowerCase()} yet`}
              description={`Add your first ${businessType.tableNoun.slice(0, -1).toLowerCase()} to start taking orders.`}
              action={canManageTables ? <Button onClick={openAddTable}>+ Add {businessType.tableNoun.slice(0, -1).toLowerCase()}</Button> : null}
            />
          ) : (
            <TableGrid
              tables={tables}
              onSelect={handleSelectTable}
              onLock={handleLockTable}
              onRelease={handleReleaseTable}
              isPending={(id) => isPending(`table-${id}`)}
            />
          )}

          {takeawayOrders.length > 0 && (
            <div className="takeaway-list">
              <h3 style={{ margin: 'var(--space-8) 0 var(--space-3)' }}>Takeaway orders in progress</h3>
              {takeawayOrders.map((order) => (
                <Card key={order.id} tight className="takeaway-row">
                  <span>
                    Order #{order.id} · {order.status === 'billed' ? 'Bill ready' : 'Open'}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <span className="tabular-nums">{formatCurrency(order.grand_total)}</span>
                    <Button size="sm" variant="secondary" onClick={() => setActiveOrder({ orderId: order.id, table: null })}>
                      Open
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeOrder && (
        <OrderBuilder
          orderId={activeOrder.orderId}
          table={activeOrder.table}
          categories={categories}
          products={products}
          onClose={() => setActiveOrder(null)}
          onSettled={loadAll}
        />
      )}

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title={`Manage ${businessType.tableNoun.toLowerCase()}`}>
        <div className="manage-tables">
          <div className="page-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>{tables.length} {businessType.tableNoun.toLowerCase()}</p>
            <Button size="sm" onClick={openAddTable}>
              + Add {businessType.tableNoun.slice(0, -1).toLowerCase()}
            </Button>
          </div>
          {tables.length === 0 ? (
            <EmptyState
              icon={businessType.showSeats ? <UtensilsCrossed size={28} /> : <Store size={28} />}
              title={`No ${businessType.tableNoun.toLowerCase()} yet`}
              description={`Add your first ${businessType.tableNoun.slice(0, -1).toLowerCase()} to start taking orders.`}
            />
          ) : (
            <div className="manage-tables-list">
              {tables.map((table) => (
                <Card key={table.id} tight className="manage-tables-row">
                  <span className="manage-tables-label">{table.label}</span>
                  {businessType.showSeats && <span className="tabular-nums">{table.seats}-seater</span>}
                  <Badge variant={table.status === 'available' ? 'success' : table.status === 'locked' ? 'neutral' : 'primary'}>
                    {table.status}
                  </Badge>
                  <div className="manage-tables-actions">
                    <Button variant="ghost" size="sm" className="btn-icon" onClick={() => openEditTable(table)} aria-label="Edit">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-icon"
                      onClick={() => handleDeleteTable(table)}
                      loading={isPending(`table-del-${table.id}`)}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={tableFormOpen}
        onClose={() => setTableFormOpen(false)}
        title={editingTable ? `Edit ${businessType.tableNoun.slice(0, -1).toLowerCase()}` : `Add ${businessType.tableNoun.slice(0, -1).toLowerCase()}`}
      >
        <TableForm
          initialValues={editingTable}
          submitLabel={editingTable ? 'Save changes' : `Add ${businessType.tableNoun.slice(0, -1).toLowerCase()}`}
          onSubmit={handleSubmitTable}
          onCancel={() => setTableFormOpen(false)}
          submitting={tableFormSubmitting}
        />
      </Modal>
    </div>
  );
}
