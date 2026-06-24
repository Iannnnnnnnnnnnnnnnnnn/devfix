import type { ReactNode } from 'react';

export default function PageActionBar({ children, stats }: { children?: ReactNode; stats?: ReactNode }) {
  return (
    <div className="page-action-bar">
      <div className="toolbar">{children}</div>
      {stats ? <div className="page-action-stats">{stats}</div> : null}
    </div>
  );
}
