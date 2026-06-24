import { useEffect, useState } from 'react';
import { fetchStats } from '../api';
import type { DiagnosisStats } from '../types';
import { ErrorBlock, LoadingBlock } from './shared';

export default function DashboardPage() {
  const [stats, setStats] = useState<DiagnosisStats>({ todayCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
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
        </>
      )}
    </div>
  );
}
