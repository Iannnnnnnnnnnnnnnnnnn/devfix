import type { FormEvent, ReactNode } from 'react';

export default function PageSearchPanel({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="page-search-panel" onSubmit={onSubmit}>
      {children}
    </form>
  );
}
