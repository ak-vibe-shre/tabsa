import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner.jsx';

export function CategoryList({ categories, selectedId, onSelect, onAdd, onDelete, isDeleting }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  function submitAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
    setAdding(false);
  }

  return (
    <div className="category-bar">
      <button
        className={`category-pill${selectedId === null ? ' active' : ''}`}
        onClick={() => onSelect(null)}
        type="button"
      >
        All items
      </button>
      {categories.map((c) => {
        const deleting = isDeleting?.(c.id);
        return (
          <button
            key={c.id}
            className={`category-pill${selectedId === c.id ? ' active' : ''}`}
            onClick={() => onSelect(c.id)}
            type="button"
          >
            {c.name}
            <span
              className="category-pill-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (!deleting) onDelete(c);
              }}
              title="Delete category"
            >
              {deleting ? <Spinner size="sm" /> : <X size={12} />}
            </span>
          </button>
        );
      })}
      {adding ? (
        <form onSubmit={submitAdd} style={{ display: 'inline-flex', gap: '4px' }}>
          <input
            className="input"
            style={{ width: '140px', padding: 'var(--space-2) var(--space-3)' }}
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => !newName && setAdding(false)}
            placeholder="Category name"
          />
        </form>
      ) : (
        <button className="category-pill category-pill-add" onClick={() => setAdding(true)} type="button">
          <Plus size={14} /> Add category
        </button>
      )}
    </div>
  );
}
