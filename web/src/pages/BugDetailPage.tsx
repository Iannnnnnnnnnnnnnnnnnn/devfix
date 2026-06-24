import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteBugIssue, fetchBugIssue, updateBugIssue } from '../api';
import MarkdownViewer from '../components/markdown/MarkdownViewer';
import type { BugIssue, BugRecord } from '../types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from './shared';

const statuses = [
  { value: 'open', label: '排查中' },
  { value: 'resolved', label: '已解决' },
  { value: 'archived', label: '已归档' },
];

export default function BugDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id || 0);
  const [issue, setIssue] = useState<BugIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [issueName, setIssueName] = useState('');
  const [status, setStatus] = useState('open');
  const [errorType, setErrorType] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadIssue();
  }, [id]);

  async function loadIssue() {
    if (!id) {
      setError('Bug 问题 ID 无效。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchBugIssue(id);
      setIssue(data);
      setIssueName(data.issueName);
      setStatus(data.status || 'open');
      setErrorType(data.errorType || '');
      setTags((data.tags || []).join(','));
      setSummary(data.summary || '');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!issueName.trim()) {
      setError('问题名称不能为空。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await updateBugIssue(id, {
        issueName: issueName.trim(),
        status,
        errorType: errorType.trim(),
        tags: parseTags(tags),
        summary: summary.trim(),
      });
      setIssue(data);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('确认删除该 Bug 问题及其排查记录？')) {
      return;
    }
    setError('');
    try {
      await deleteBugIssue(id);
      navigate('/bug/archive');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingBlock />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="page">
        <ErrorBlock message={error} />
        <Link className="action-button" to="/bug/archive">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/bug/archive">Bug 档案</Link>
        <span>/</span>
        <span>{issue.projectName || `项目 #${issue.projectId}`}</span>
        <span>/</span>
        <span>{issue.sceneName || `场景 #${issue.sceneId}`}</span>
        <span>/</span>
        <strong>{issue.issueName}</strong>
      </div>

      <header className="page-header">
        <div>
          <h1>{issue.issueName}</h1>
          <p className="muted">更新于 {formatTime(issue.updatedAt)}</p>
        </div>
        <div className="toolbar">
          <Link className="primary-button" to={`/bug/new?issueId=${issue.id}`}>
            新增排查记录
          </Link>
          <button className="action-button" type="button" onClick={() => setEditing((value) => !value)}>
            编辑问题
          </button>
          <Link className="action-button" to="/bug/archive">
            返回列表
          </Link>
        </div>
      </header>

      <ErrorBlock message={error} />

      <section className="panel bug-detail-header">
        <div>
          <span className={`status-pill status-${issue.status || 'open'}`}>{statusLabel(issue.status)}</span>
          <h2>{issue.errorType || '未填写错误类型'}</h2>
          <p>{issue.summary || '暂无摘要'}</p>
        </div>
        <div className="meta-grid">
          <MetaItem label="项目" value={issue.projectName || `项目 #${issue.projectId}`} />
          <MetaItem label="场景" value={issue.sceneName || `场景 #${issue.sceneId}`} />
          <MetaItem label="更新时间" value={formatTime(issue.updatedAt)} />
        </div>
        <TagList tags={issue.tags} />
      </section>

      {editing ? (
        <form className="panel bug-edit-panel" onSubmit={handleUpdate}>
          <h2>编辑基础信息</h2>
          <label>
            问题名称
            <input value={issueName} onChange={(event) => setIssueName(event.target.value)} />
          </label>
          <div className="form-grid">
            <label>
              状态
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              错误类型
              <input value={errorType} onChange={(event) => setErrorType(event.target.value)} />
            </label>
            <label>
              标签
              <input value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
          </div>
          <label>
            摘要
            <input value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <div className="toolbar">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存修改'}
            </button>
            <button className="action-button danger" type="button" onClick={handleDelete}>
              删除问题
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <h2>排查记录时间线</h2>
          <span className="muted">{issue.records?.length || 0} 条记录</span>
        </div>
        <InvestigationTimeline records={issue.records || []} />
      </section>
    </div>
  );
}

function InvestigationTimeline({ records }: { records: BugRecord[] }) {
  if (!records.length) {
    return <EmptyBlock text="暂无排查记录" />;
  }
  return (
    <div className="timeline">
      {records.map((record) => (
        <article className="timeline-item" key={record.id}>
          <div className="timeline-meta">
            <strong>#{record.id}</strong>
            <span>{record.source || '-'}</span>
            <time>{formatTime(record.createdAt)}</time>
          </div>
          <MarkdownViewer content={record.finalContent || record.aiSummary || record.rawContent || ''} />
          {record.rawContent ? (
            <details className="record-detail">
              <summary>展开原始白话输入</summary>
              <pre>{record.rawContent}</pre>
            </details>
          ) : null}
          {record.aiSummary ? (
            <details className="record-detail">
              <summary>查看 AI 整理内容</summary>
              <MarkdownViewer content={record.aiSummary} />
            </details>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TagList({ tags }: { tags?: string[] }) {
  const list = tags || [];
  if (!list.length) {
    return <p className="muted">暂无标签</p>;
  }
  return (
    <div className="tag-list">
      {list.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusLabel(value?: string) {
  return statuses.find((item) => item.value === value)?.label || value || '-';
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}
