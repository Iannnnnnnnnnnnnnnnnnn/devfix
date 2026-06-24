import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createBugIssue, fetchBugIssue, saveBugRecord, summarizeBugRecord } from '../api';
import MarkdownViewer from '../components/markdown/MarkdownViewer';
import type { BugIssue, Project, Scene } from '../types';
import { ErrorBlock, LoadingBlock, ProjectPicker, ScenePicker } from './shared';

const statuses = [
  { value: 'open', label: '排查中' },
  { value: 'resolved', label: '已解决' },
  { value: 'archived', label: '已归档' },
];

export default function BugNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const issueId = Number(searchParams.get('issueId') || 0);
  const [existingIssue, setExistingIssue] = useState<BugIssue | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [createdIssueId, setCreatedIssueId] = useState<number | null>(null);
  const [issueName, setIssueName] = useState('');
  const [status, setStatus] = useState('open');
  const [errorType, setErrorType] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [finalContentMode, setFinalContentMode] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lockedIssue = Boolean(existingIssue || createdIssueId);

  useEffect(() => {
    if (!issueId) {
      return;
    }
    setLoading(true);
    fetchBugIssue(issueId)
      .then((issue) => {
        setExistingIssue(issue);
        setProject({ id: issue.projectId, name: issue.projectName || `项目 #${issue.projectId}` });
        setScene({ id: issue.sceneId, projectId: issue.projectId, name: issue.sceneName || `场景 #${issue.sceneId}` });
        setCreatedIssueId(issue.id);
        setIssueName(issue.issueName);
        setStatus(issue.status || 'open');
        setErrorType(issue.errorType || '');
        setTags((issue.tags || []).join(','));
        setSummary(issue.summary || '');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [issueId]);

  async function ensureIssue() {
    if (createdIssueId) {
      return createdIssueId;
    }
    if (!project || !scene) {
      throw new Error('请先选择项目和场景。');
    }
    if (!issueName.trim()) {
      throw new Error('问题名称不能为空。');
    }
    const result = await createBugIssue({
      projectId: project.id,
      sceneId: scene.id,
      issueName: issueName.trim(),
      status,
      errorType: errorType.trim() || undefined,
      tags: parseTags(tags),
    });
    setCreatedIssueId(result.id);
    return result.id;
  }

  async function handleSummarize() {
    if (!rawContent.trim()) {
      setError('请先输入排查过程。');
      return;
    }
    setSummarizing(true);
    setError('');
    try {
      const nextIssueId = await ensureIssue();
      const result = await summarizeBugRecord({
        projectId: project!.id,
        issueId: nextIssueId,
        rawContent: rawContent.trim(),
        source: 'web',
      });
      setAiSummary(result.aiSummary || '');
      setFinalContent(result.aiSummary || '');
      if (result.suggestedErrorType && !errorType.trim()) {
        setErrorType(result.suggestedErrorType);
      }
      if (result.suggestedTags?.length && !tags.trim()) {
        setTags(result.suggestedTags.join(','));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSummarizing(false);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!finalContent.trim()) {
      setError('最终归档内容不能为空。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const nextIssueId = await ensureIssue();
      await saveBugRecord({
        projectId: project!.id,
        issueId: nextIssueId,
        rawContent: rawContent.trim(),
        aiSummary,
        finalContent: finalContent.trim(),
        source: 'web',
        status,
        errorType: errorType.trim(),
        tags: parseTags(tags),
        summary: summary.trim() || undefined,
      });
      navigate(`/bug/archive/${nextIssueId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingBlock />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>新建 Bug</h1>
          <p className="muted">{existingIssue ? '为已有问题追加排查记录。' : '创建问题并归档一次排查过程。'}</p>
        </div>
        <Link className="action-button" to="/bug/archive">
          返回档案
        </Link>
      </header>

      <form className="bug-new-flow" onSubmit={handleSave}>
        <section className="panel">
          <h2>第一步：选择层级</h2>
          {lockedIssue ? (
            <div className="readonly-grid">
              <div>
                <span className="muted">项目</span>
                <strong>{project?.name || '-'}</strong>
              </div>
              <div>
                <span className="muted">场景</span>
                <strong>{scene?.name || '-'}</strong>
              </div>
            </div>
          ) : (
            <div className="form-grid two-columns">
              <ProjectPicker value={project?.id} onChange={setProject} allowCreate />
              <ScenePicker projectId={project?.id} value={scene?.id} onChange={setScene} allowCreate />
            </div>
          )}
        </section>

        <section className="panel">
          <h2>第二步：填写问题信息</h2>
          <label>
            问题名称
            <input
              value={issueName}
              onChange={(event) => setIssueName(event.target.value)}
              disabled={lockedIssue}
              placeholder="后端启动失败：8088 端口被占用"
            />
          </label>
          <div className="form-grid">
            <label>
              状态
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              错误类型
              <input value={errorType} onChange={(event) => setErrorType(event.target.value)} placeholder="Spring Boot 启动失败" />
            </label>
            <label>
              标签
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="端口占用,Java 进程" />
            </label>
          </div>
          <label>
            简短摘要
            <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="可选" />
          </label>
        </section>

        <section className="panel">
          <h2>第三步：输入排查过程</h2>
          <label>
            白话输入
            <textarea
              value={rawContent}
              onChange={(event) => setRawContent(event.target.value)}
              rows={10}
              placeholder="粘贴日志、命令、排查步骤或白话记录"
            />
          </label>
          <button className="action-button primary" type="button" disabled={summarizing} onClick={handleSummarize}>
            {summarizing ? 'AI 整理中...' : 'AI 整理'}
          </button>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>第四步：AI 整理结果</h2>
            <div className="tabs compact-tabs">
              <button
                className={finalContentMode === 'edit' ? 'tab active' : 'tab'}
                type="button"
                onClick={() => setFinalContentMode('edit')}
              >
                编辑
              </button>
              <button
                className={finalContentMode === 'preview' ? 'tab active' : 'tab'}
                type="button"
                onClick={() => setFinalContentMode('preview')}
              >
                预览
              </button>
            </div>
          </div>
          {finalContentMode === 'edit' ? (
            <textarea value={finalContent} onChange={(event) => setFinalContent(event.target.value)} rows={14} />
          ) : (
            <MarkdownViewer content={finalContent} className="markdown-preview-box" />
          )}
          {aiSummary ? (
            <details className="record-detail">
              <summary>查看 AI 原始整理内容</summary>
              <MarkdownViewer content={aiSummary} />
            </details>
          ) : null}
        </section>

        <section className="panel save-panel">
          <h2>第五步：保存归档</h2>
          <ErrorBlock message={error} />
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存为 Bug 档案'}
          </button>
        </section>
      </form>
    </div>
  );
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
