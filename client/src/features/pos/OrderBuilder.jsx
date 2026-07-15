import { useMemo, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { FoodTypeDot } from '../../components/ui/Badge.jsx';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { usePendingSet } from '../../lib/usePendingSet.js';
import { usePosOrder } from './usePosOrder.js';
import { BillModal } from './BillModal.jsx';
import { formatCurrency, splitGst } from '../../lib/format.js';

const STATUS_VARIANT = { open: 'primary', billed: 'warning', paid: 'success', cancelled: 'danger' };

export function OrderBuilder({ orderId, table, categories, products, onClose, onSettled }) {
  const toast = useToast();
  const businessType = useCurrentBusinessType();
  const { order, addItem, setItemQuantity, removeItem, bill, pay, cancel } = usePosOrder(orderId);
  const [activeCategory, setActiveCategory] = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const { isPending, withPending } = usePendingSet();

  const visibleProducts = useMemo(() => {
    const available = products.filter((m) => m.is_available);
    return activeCategory ? available.filter((m) => m.category_id === activeCategory) : available;
  }, [products, activeCategory]);

  if (!order) return null;

  const isOpen = order.status === 'open';
  const isBilled = order.status === 'billed';
  const { cgst, sgst } = splitGst(order.tax_total);

  const handleAdd = (item) =>
    withPending(`add-${item.id}`, async () => {
      try {
        await addItem(item.id);
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleQuantityChange = (item, delta) =>
    withPending(`qty-${item.id}`, async () => {
      try {
        await setItemQuantity(item.id, item.quantity + delta);
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleRemove = (item) =>
    withPending(`qty-${item.id}`, async () => {
      try {
        await removeItem(item.id);
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleBill = withPending('bill', async () => {
    try {
      await bill();
      setBillModalOpen(true);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  async function handleConfirmPayment(method) {
    try {
      await pay(method);
      toast('Payment recorded', 'success');
      setBillModalOpen(false);
      onSettled();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const handleCancel = withPending('cancel', async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      await cancel();
      toast('Order cancelled', 'success');
      onSettled();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  return (
    <>
      <Drawer open onClose={onClose}>
        <div className="order-builder">
          <div className="order-builder-header">
            <div>
              <div className="order-builder-title">{table ? table.label : `Takeaway #${order.id}`}</div>
              <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="order-builder-body">
            {isOpen && (
              <>
                <div className="order-category-tabs">
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
                <div className="order-menu-list">
                  {visibleProducts.map((item) => {
                    const adding = isPending(`add-${item.id}`);
                    return (
                      <div
                        key={item.id}
                        className={`order-menu-item${adding ? ' order-menu-item-pending' : ''}`}
                        onClick={() => !adding && handleAdd(item)}
                      >
                        <span className="order-menu-item-name">
                          {businessType.key === 'restaurant' && item.food_type && <FoodTypeDot foodType={item.food_type} />}
                          {item.name}
                        </span>
                        {adding ? <Spinner size="sm" /> : <span className="tabular-nums">{formatCurrency(item.price)}</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="order-cart">
              <div className="order-cart-title">
                {isOpen ? 'Current order' : 'Order items'} ({order.items.length})
              </div>
              {order.items.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>No items added yet. Tap a {businessType.productNoun.singular.toLowerCase()} to add it.</p>
              ) : (
                order.items.map((item) => {
                  const itemPending = isPending(`qty-${item.id}`);
                  return (
                    <div key={item.id} className="order-cart-row">
                      <span className="order-cart-row-name">{item.item_name_snapshot}</span>
                      {isOpen ? (
                        <div className="qty-stepper">
                          <button type="button" disabled={itemPending} onClick={() => handleQuantityChange(item, -1)}>
                            −
                          </button>
                          {itemPending ? <Spinner size="sm" /> : <span className="tabular-nums">{item.quantity}</span>}
                          <button type="button" disabled={itemPending} onClick={() => handleQuantityChange(item, 1)}>
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="tabular-nums">× {item.quantity}</span>
                      )}
                      <span className="tabular-nums" style={{ minWidth: '72px', textAlign: 'right' }}>
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                      {isOpen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-icon"
                          onClick={() => handleRemove(item)}
                          loading={itemPending}
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}

              <div className="order-totals">
                <div className="order-total-row">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="order-total-row">
                  <span>CGST</span>
                  <span className="tabular-nums">{formatCurrency(cgst)}</span>
                </div>
                <div className="order-total-row">
                  <span>SGST</span>
                  <span className="tabular-nums">{formatCurrency(sgst)}</span>
                </div>
                <div className="order-total-row grand">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(order.grand_total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-builder-footer">
            {isOpen && (
              <>
                <Button variant="danger" onClick={handleCancel} loading={isPending('cancel')}>
                  Cancel order
                </Button>
                <Button onClick={handleBill} disabled={order.items.length === 0} loading={isPending('bill')}>
                  Generate bill
                </Button>
              </>
            )}
            {isBilled && (
              <>
                <Button variant="danger" onClick={handleCancel} loading={isPending('cancel')}>
                  Cancel order
                </Button>
                <Button onClick={() => setBillModalOpen(true)}>Collect payment</Button>
              </>
            )}
          </div>
        </div>
      </Drawer>

      <BillModal
        order={order}
        open={billModalOpen && isBilled}
        onClose={() => setBillModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />
    </>
  );
}
