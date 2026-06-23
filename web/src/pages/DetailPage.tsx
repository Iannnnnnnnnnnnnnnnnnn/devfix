import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchDiagnosisDetail } from '../api';
import type { DiagnosisDetailResponse } from '../types';
import { DiagnosisReport, ErrorBlock, LoadingBlock } from './shared';

export default function DetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<DiagnosisDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('缺少记录 ID');
      setLoading(false);
      return;
    }
    fetchDiagnosisDetail(id)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Detail</p>
          <h1>分析详情</h1>
        </div>
        <Link className="action-button" to="/history">
          返回历史
        </Link>
      </header>
      <ErrorBlock message={error} />
      {loading ? <LoadingBlock /> : null}
      {detail ? (
        <>
          <section className="panel full">
            <h2>基本信息</h2>
            <div className="meta-grid">
              <span>记录 ID：#{detail.id}</span>
              <span>项目：{detail.projectName}</span>
              <span>类型：{detail.errorType}</span>
              <span>环境：{detail.environment}</span>
              <span>状态：{detail.status}</span>
              <span>时间：{formatTime(detail.createdAt)}</span>
            </div>
          </section>
          <DiagnosisReport result={detail} />
          <section className="panel full">
            <h2>原始日志</h2>
            <pre className="raw-log">{detail.rawLog || '暂无日志'}</pre>
          </section>
        </>
      ) : null}
    </div>
  );
}

function formatTime(value: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '';
}
