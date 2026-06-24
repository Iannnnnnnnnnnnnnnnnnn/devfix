import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import './markdown-viewer.css';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  table({ children, ...props }) {
    return (
      <div className="markdown-table-scroll">
        <table {...props}>{children}</table>
      </div>
    );
  },
};

export default function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const normalizedContent = content?.trim();
  const classes = ['markdown-viewer', className].filter(Boolean).join(' ');

  if (!normalizedContent) {
    return <div className={`${classes} markdown-viewer-empty`}>暂无内容</div>;
  }

  return (
    <div className={classes}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
