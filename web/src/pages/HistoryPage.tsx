import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHistory } from '../api';
import type { HistoryRecord } from '../types';
import { ErrorBlock, LoadingBlock } from './shared';

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory()
      .then(setHistory)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h1>历史分析记录</h1>
        </div>
      </header>
      <ErrorBlock message={error} />
      {loading ? (
        <LoadingBlock />
      ) : (
        <section className="panel full">
          {history.length ? (
            <div className="history-list">
              {history.map((item) => (
                <Link className="history-row" to={`/history/${item.id}`} key={item.id}>
                  <span>#{item.id}</span>
                  <strong>{item.projectName}</strong>
                  <em>{item.errorType}</em>
                  <em>{item.environment}</em>
                  <p>{item.summary}</p>
                  <time>{formatTime(item.createdAt)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="state-block">暂无历史记录</div>
          )}
        </section>
      )}
    </div>
  );
}

function formatTime(value: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '';
}
