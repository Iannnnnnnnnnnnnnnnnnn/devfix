export default function StatusTag({ children, tone = 'blue' }: { children: string; tone?: 'blue' | 'green' | 'orange' | 'red' | 'gray' }) {
  return <span className={`status-tag status-tag-${tone}`}>{children}</span>;
}
