import { Field, Input, Select, Switch } from '../ui/Field.jsx';

function toTitleCase(slug) {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function defaultForField(field) {
  if (field.type === 'boolean') return false;
  if (field.type === 'select') return field.options?.[0] ?? '';
  return '';
}

export function DynamicField({ field, value, onChange }) {
  switch (field.type) {
    case 'boolean':
      return (
        <Field label={field.label}>
          <Switch checked={!!value} onChange={() => onChange(field.key, !value)} label={field.label} />
        </Field>
      );
    case 'select':
      return (
        <Field label={field.label}>
          <Select value={value ?? ''} onChange={(e) => onChange(field.key, e.target.value)}>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {toTitleCase(opt)}
              </option>
            ))}
          </Select>
        </Field>
      );
    case 'number':
      return (
        <Field label={field.label}>
          <Input type="number" value={value ?? ''} onChange={(e) => onChange(field.key, e.target.value)} />
        </Field>
      );
    case 'text':
    default:
      return (
        <Field label={field.label}>
          <Input type="text" value={value ?? ''} onChange={(e) => onChange(field.key, e.target.value)} />
        </Field>
      );
  }
}
