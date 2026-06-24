import type { ReactNode } from 'react';

export default function PageContainer({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page admin-page">
      <header className="page-header admin-page-header">
        <div>
          <h1>{title}</h1>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        {actions ? <div className="toolbar">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
