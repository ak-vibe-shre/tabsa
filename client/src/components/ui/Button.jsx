import { Spinner } from './Spinner.jsx';

export function Button({ variant = 'primary', size = 'md', className = '', loading = false, disabled, children, ...props }) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', className].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
}
