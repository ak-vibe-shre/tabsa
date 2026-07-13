export function Card({ tight = false, interactive = false, className = '', children, ...props }) {
  const classes = ['card', tight ? 'card-tight' : '', interactive ? 'card-interactive' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
