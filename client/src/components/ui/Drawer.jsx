export function Drawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">{children}</div>
    </>
  );
}
