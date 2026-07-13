import { useEffect, useState } from 'react';
import { ClipboardList, Package } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { CategoryList } from './CategoryList.jsx';
import { ProductCard } from './ProductCard.jsx';
import { ProductForm } from './ProductForm.jsx';
import './products.css';

export function ProductsPage() {
  const businessType = useCurrentBusinessType();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const toast = useToast();

  async function loadAll() {
    setLoading(true);
    try {
      const [cats, products] = await Promise.all([api.get('/categories'), api.get('/products')]);
      setCategories(cats);
      setItems(products);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddCategory(name) {
    try {
      const category = await api.post('/categories', { name, sort_order: categories.length + 1 });
      setCategories((prev) => [...prev, category]);
      toast(`Added category "${name}"`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDeleteCategory(category) {
    if (!confirm(`Delete category "${category.name}"? Items in it will also be removed.`)) return;
    try {
      await api.del(`/categories/${category.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setItems((prev) => prev.filter((i) => i.category_id !== category.id));
      if (selectedCategory === category.id) setSelectedCategory(null);
      toast('Category deleted', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function openAddItem() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEditItem(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSubmitItem(payload) {
    try {
      if (editingItem) {
        const updated = await api.patch(`/products/${editingItem.id}`, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast(`${businessType.productNoun.singular} updated`, 'success');
      } else {
        const created = await api.post('/products', payload);
        setItems((prev) => [...prev, created]);
        toast(`${businessType.productNoun.singular} added`, 'success');
      }
      setFormOpen(false);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDeleteItem(item) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.del(`/products/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast(`${businessType.productNoun.singular} deleted`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleToggleAvailability(item) {
    try {
      const updated = await api.patch(`/products/${item.id}/availability`, { is_available: !item.is_available });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const visibleItems = selectedCategory ? items.filter((i) => i.category_id === selectedCategory) : items;

  return (
    <div>
      <div className="page-toolbar">
        <p style={{ color: 'var(--color-text-muted)' }}>
          {items.length} items across {categories.length} categories
        </p>
        <Button onClick={openAddItem} disabled={categories.length === 0}>
          + Add {businessType.productNoun.singular.toLowerCase()}
        </Button>
      </div>

      <CategoryList
        categories={categories}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
        onAdd={handleAddCategory}
        onDelete={handleDeleteCategory}
      />

      {loading ? (
        <div className="menu-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="180px" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No categories yet"
          description={`Add your first category to start building your ${businessType.productNoun.plural.toLowerCase()}.`}
        />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={<Package size={28} />}
          title={`No ${businessType.productNoun.plural.toLowerCase()} yet`}
          description={`Add your first ${businessType.productNoun.singular.toLowerCase()} to this category.`}
        />
      ) : (
        <div className="menu-grid">
          {visibleItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onEdit={openEditItem}
              onDelete={handleDeleteItem}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingItem ? `Edit ${businessType.productNoun.singular.toLowerCase()}` : `Add ${businessType.productNoun.singular.toLowerCase()}`}
      >
        <ProductForm
          categories={categories}
          initialValues={editingItem}
          submitLabel={editingItem ? 'Save changes' : `Add ${businessType.productNoun.singular.toLowerCase()}`}
          onSubmit={handleSubmitItem}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
