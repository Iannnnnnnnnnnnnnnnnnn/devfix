import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHistory, fetchStats } from '../api';
import type { DiagnosisStats, HistoryRecord } from '../types';
import { ErrorBlock, LoadingBlock } from './shared';

export default function DashboardPage() {
  const [stats, setStats] = useState<DiagnosisStats>({ todayCount: 0, totalCount: 0 });
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchStats(), fetchHistory()])
      .then(([statsData, historyData]) => {
        setStats(statsData);
        setHistory(historyData.slice(0, 5));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>开发排错工作台</h1>
        </div>
      </header>
      <ErrorBlock message={error} />
      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>今日分析数量</span>
              <strong>{stats.todayCount}</strong>
            </div>
            <div className="stat-card">
              <span>历史分析数量</span>
              <strong>{stats.totalCount}</strong>
            </div>
          </div>
          <div className="quick-actions">
            <Link className="action-button primary" to="/analyze">
              日志分析入口
            </Link>
            <Link className="action-button" to="/command">
              命令助手入口
            </Link>
            <Link className="action-button" to="/history">
              最近分析记录
            </Link>
          </div>
          <section className="panel full">
            <h2>最近分析记录</h2>
            {history.length ? (
              <div className="history-list compact">
                {history.map((item) => (
                  <Link to={`/history/${item.id}`} className="history-row" key={item.id}>
                    <span>#{item.id}</span>
                    <strong>{item.projectName}</strong>
                    <em>{item.errorType}</em>
                    <p>{item.summary}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="state-block">暂无历史记录</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
