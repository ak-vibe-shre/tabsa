import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DynamicField, defaultForField } from '../../components/dynamic/DynamicField.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { api } from '../../lib/apiClient.js';
import { ProductImage } from './ProductImage.jsx';

export function ProductForm({ categories, initialValues, onSubmit, onCancel, submitLabel = 'Save item' }) {
  const businessType = useCurrentBusinessType();
  const productFields = businessType.productFields ?? [];
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState(() => {
    const base = {
      category_id: initialValues?.category_id ?? categories[0]?.id ?? '',
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      price: initialValues?.price ?? '',
      tax_percent: initialValues?.tax_percent ?? 5,
      image_url: initialValues?.image_url ?? '',
    };
    const extra = {};
    for (const f of productFields) {
      extra[f.key] = initialValues?.[f.key] ?? defaultForField(f);
    }
    return { ...base, ...extra };
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await api.upload('/uploads/image', formData);
      update('image_url', url);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      price: Number(form.price),
      tax_percent: Number(form.tax_percent),
      image_url: form.image_url.trim() || null,
    };
    for (const f of productFields) {
      if (f.type === 'number' && payload[f.key] !== '' && payload[f.key] != null) {
        payload[f.key] = Number(payload[f.key]);
      }
    }
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-grid-full">
          <Field label={`${businessType.productNoun.singular} name`}>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
          </Field>
        </div>
        <div className="form-grid-full">
          <Field label="Description (optional)">
            <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>
        </div>
        <div className="form-grid-full">
          <Field label="Image (optional — a default image is used if left blank)">
            <div className="product-form-image-row">
              <div className="product-form-image-preview">
                <ProductImage imageUrl={form.image_url} alt="Preview" />
              </div>
              <div className="product-form-image-controls">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Upload image
                </Button>
                <Input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => update('image_url', e.target.value)}
                  placeholder="Or paste an image URL"
                />
              </div>
            </div>
          </Field>
        </div>
        <Field label="Category">
          <Select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {productFields.map((f) => (
          <DynamicField key={f.key} field={f} value={form[f.key]} onChange={update} />
        ))}
        <Field label="Price (₹)">
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} required />
        </Field>
        <Field label="Tax %">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.tax_percent}
            onChange={(e) => update('tax_percent', e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-6)', borderTop: 'none' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
