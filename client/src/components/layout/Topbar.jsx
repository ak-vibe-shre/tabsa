import { Sun, Moon } from 'lucide-react';

export function Topbar({ title, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">
        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
