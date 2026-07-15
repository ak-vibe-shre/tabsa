import { Spinner } from './Spinner.jsx';

export function Field({ label, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
    </label>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="select" {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />;
}

export function Switch({ checked, onChange, label, loading = false }) {
  return (
    <label className={`switch${loading ? ' switch-loading' : ''}`} title={label}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={loading} />
      <span className="switch-track" />
      {loading && <Spinner size="sm" />}
    </label>
  );
}
