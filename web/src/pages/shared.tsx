import type { CommandItem, DiagnosisResponse } from '../types';

export function RiskTag({ level }: { level: string }) {
  const normalized = level || 'safe';
  return <span className={`risk-tag risk-${normalized}`}>{normalized}</span>;
}

export function LoadingBlock({ text = '加载中...' }: { text?: string }) {
  return <div className="state-block">{text}</div>;
}

export function ErrorBlock({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return <div className="error-block">{message}</div>;
}

export function EmptyBlock({ text }: { text: string }) {
  return <div className="state-block">{text}</div>;
}

export function CommandList({ commands }: { commands: CommandItem[] }) {
  if (!commands?.length) {
    return <EmptyBlock text="暂无推荐命令" />;
  }
  return (
    <div className="command-list">
      {commands.map((item, index) => (
        <div className="command-card" key={`${item.command}-${index}`}>
          <div className="command-meta">
            <RiskTag level={item.riskLevel} />
            <span>{item.readonly ? '只读' : '可能修改系统'}</span>
          </div>
          {item.command ? <pre>{item.command}</pre> : <pre>无可执行命令</pre>}
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function DiagnosisReport({ result }: { result: DiagnosisResponse }) {
  return (
    <div className="report-grid">
      <section className="panel full">
        <h2>报错结论</h2>
        <p className="large-text">{result.summary || '暂无结论'}</p>
      </section>
      <section className="panel full">
        <h2>最可能原因</h2>
        <p>{result.rootCause || '暂无原因'}</p>
      </section>
      <ListPanel title="关键证据" items={result.evidence} />
      <section className="panel">
        <h2>建议排查命令</h2>
        <CommandList commands={result.commands} />
      </section>
      <ListPanel title="修复步骤" items={result.fixSteps} ordered />
      <ListPanel title="风险提醒" items={result.warnings} />
      <ListPanel title="还需要补充的信息" items={result.needMoreInfo} />
    </div>
  );
}

function ListPanel({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const safeItems = items || [];
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <section className="panel">
      <h2>{title}</h2>
      {safeItems.length ? (
        <ListTag className="item-list">
          {safeItems.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ListTag>
      ) : (
        <EmptyBlock text="暂无内容" />
      )}
    </section>
  );
}
