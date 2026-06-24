import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  confirmSummaryImport,
  deleteSummaryDoc,
  exportSummaryDoc,
  exportSummaryDocs,
  fetchProjects,
  fetchScenes,
  fetchSummaryDocs,
  generateCommandSummary,
  generateLogSummary,
  previewSummaryImport,
} from '../api';
import DataTable, { type DataTableColumn } from '../components/common/DataTable';
import PageActionBar from '../components/common/PageActionBar';
import PageContainer from '../components/common/PageContainer';
import PageSearchPanel from '../components/common/PageSearchPanel';
import StatusTag from '../components/common/StatusTag';
import TablePagination from '../components/common/TablePagination';
import MarkdownViewer from '../components/markdown/MarkdownViewer';
import type { Project, Scene, SummaryDoc, SummaryImportPreview } from '../types';
import { ErrorBlock, ProjectPicker, ScenePicker } from './shared';

type SummaryType = 'command' | 'log_problem' | '';

interface SearchState {
  projectId: string;
  sceneId: string;
  summaryType: SummaryType;
  title: string;
  tags: string;
  startTime: string;
  endTime: string;
}

const initialSearch: SearchState = {
  projectId: '',
  sceneId: '',
  summaryType: '',
  title: '',
  tags: '',
  startTime: '',
  endTime: '',
};

export default function SummaryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [docs, setDocs] = useState<SummaryDoc[]>([]);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [current, setCurrent] = useState<SummaryDoc | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    setSearch((current) => ({ ...current, sceneId: '' }));
    setScenes([]);
    if (!search.projectId) {
      return;
    }
    fetchScenes(Number(search.projectId))
      .then(setScenes)
      .catch((err: Error) => setError(err.message));
  }, [search.projectId]);

  useEffect(() => {
    void loadDocs();
  }, [page, pageSize]);

  async function loadDocs(overrides: Partial<SearchState> = {}) {
    const state = { ...search, ...overrides };
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (state.projectId) params.set('projectId', state.projectId);
      if (state.sceneId) params.set('sceneId', state.sceneId);
      if (state.summaryType) params.set('type', state.summaryType);
      if (state.title.trim()) params.set('title', state.title.trim());
      if (state.tags.trim()) params.set('tags', state.tags.trim());
      if (state.startTime) params.set('startTime', `${state.startTime}T00:00:00`);
      if (state.endTime) params.set('endTime', `${state.endTime}T23:59:59`);
      const data = await fetchSummaryDocs(params);
      setDocs(data.list);
      setTotal(data.total);
      setSelectedIds([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (page !== 1) {
      setPage(1);
      return;
    }
    void loadDocs();
  }

  function handleReset() {
    setSearch(initialSearch);
    setPage(1);
    void loadDocs(initialSearch);
  }

  async function handleGenerate(type: 'command' | 'log_problem') {
    if (!search.projectId) {
      setError('请先选择项目后再生成总结。');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const payload = { projectId: Number(search.projectId), sceneId: search.sceneId ? Number(search.sceneId) : undefined };
      if (type === 'command') {
        await generateCommandSummary(payload);
      } else {
        await generateLogSummary(payload);
      }
      await loadDocs();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(doc: SummaryDoc) {
    try {
      const blob = await exportSummaryDoc(doc.id);
      downloadBlob(blob, `devai-summary-${doc.id}.devai-summary.json`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleBatchExport() {
    const ids = selectedIds.map(Number);
    if (!ids.length) {
      setError('请先勾选要导出的总结文档。');
      return;
    }
    try {
      const blob = await exportSummaryDocs(ids);
      downloadBlob(blob, `devai-summary-batch-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.devai-summary.json`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(doc: SummaryDoc) {
    if (!window.confirm(`确认删除「${doc.title || `总结 #${doc.id}`}」？`)) {
      return;
    }
    try {
      await deleteSummaryDoc(doc.id);
      await loadDocs();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const projectNameMap = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);
  const sceneNameMap = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene.name])), [scenes]);
  const columns: Array<DataTableColumn<SummaryDoc>> = [
    { key: 'index', title: '序号', width: 70, render: (_, index) => (page - 1) * pageSize + index + 1 },
    {
      key: 'title',
      title: '标题',
      width: 240,
      render: (doc) => (
        <button className="table-action-link" type="button" onClick={() => setCurrent(doc)}>
          {doc.title || `总结 #${doc.id}`}
        </button>
      ),
    },
    { key: 'project', title: '项目', width: 140, render: (doc) => projectNameMap.get(doc.projectId) || `项目 #${doc.projectId}` },
    { key: 'scene', title: '场景', width: 140, render: (doc) => (doc.sceneId ? sceneNameMap.get(doc.sceneId) || `场景 #${doc.sceneId}` : '-') },
    { key: 'type', title: '总结类型', width: 130, render: (doc) => <StatusTag>{summaryTypeLabel(doc.summaryType)}</StatusTag> },
    { key: 'tags', title: '标签', width: 160, render: (doc) => doc.tags || '-' },
    { key: 'source', title: '来源', width: 110, render: (doc) => doc.importSource || 'ai_generate' },
    { key: 'model', title: '模型', width: 120, render: (doc) => doc.modelName || '-' },
    { key: 'updatedAt', title: '更新时间', width: 170, render: (doc) => formatTime(doc.updatedAt || doc.createdAt) },
    {
      key: 'actions',
      title: '操作',
      width: 150,
      render: (doc) => (
        <div className="table-actions">
          <button className="table-action-link" type="button" onClick={() => setCurrent(doc)}>
            查看
          </button>
          <button className="table-action-link" type="button" onClick={() => handleExport(doc)}>
            导出
          </button>
          <button className="table-action-link danger" type="button" onClick={() => handleDelete(doc)}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="总结文档">
      <PageSearchPanel onSubmit={handleSearch}>
        <label>
          项目
          <select value={search.projectId} onChange={(event) => setSearch((current) => ({ ...current, projectId: event.target.value }))}>
            <option value="">全部项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          场景
          <select
            disabled={!search.projectId}
            value={search.sceneId}
            onChange={(event) => setSearch((current) => ({ ...current, sceneId: event.target.value }))}
          >
            <option value="">{search.projectId ? '全部场景' : '请先选择项目'}</option>
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          总结类型
          <select
            value={search.summaryType}
            onChange={(event) => setSearch((current) => ({ ...current, summaryType: event.target.value as SummaryType }))}
          >
            <option value="">全部类型</option>
            <option value="command">命令总结</option>
            <option value="log_problem">日志问题总结</option>
          </select>
        </label>
        <label>
          标题关键词
          <input
            value={search.title}
            onChange={(event) => setSearch((current) => ({ ...current, title: event.target.value }))}
            placeholder="标题关键词"
          />
        </label>
        <label>
          标签
          <input value={search.tags} onChange={(event) => setSearch((current) => ({ ...current, tags: event.target.value }))} />
        </label>
        <label>
          开始时间
          <input
            type="date"
            value={search.startTime}
            onChange={(event) => setSearch((current) => ({ ...current, startTime: event.target.value }))}
          />
        </label>
        <label>
          结束时间
          <input
            type="date"
            value={search.endTime}
            onChange={(event) => setSearch((current) => ({ ...current, endTime: event.target.value }))}
          />
        </label>
        <div className="search-buttons">
          <button className="primary-button" type="submit">
            查询
          </button>
          <button className="action-button" type="button" onClick={handleReset}>
            重置
          </button>
        </div>
      </PageSearchPanel>

      <PageActionBar stats={<span>总数：{total}</span>}>
        <button className="primary-button" type="button" onClick={() => setImportOpen(true)}>
          导入
        </button>
        <button className="action-button" type="button" onClick={handleBatchExport}>
          批量导出
        </button>
        <button className="action-button danger" type="button" onClick={() => setError('批量删除接口暂未接入。')}>
          批量删除
        </button>
        <button className="action-button" type="button" disabled={generating} onClick={() => handleGenerate('command')}>
          手动生成命令总结
        </button>
        <button className="action-button" type="button" disabled={generating} onClick={() => handleGenerate('log_problem')}>
          手动生成日志问题总结
        </button>
      </PageActionBar>

      <ErrorBlock message={error} />
      <section className="admin-list-panel">
        <DataTable
          columns={columns}
          data={docs}
          emptyText="暂无总结文档"
          loading={loading}
          rowKey={(doc) => doc.id}
          selectedRowKeys={selectedIds}
          onSelectedRowKeysChange={setSelectedIds}
        />
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </section>

      {current ? (
        <aside className="summary-drawer" aria-label="总结详情">
          <div className="summary-drawer-header">
            <h2>{current.title || `总结 #${current.id}`}</h2>
            <button className="icon-button" type="button" title="关闭" onClick={() => setCurrent(null)}>
              ×
            </button>
          </div>
          <div className="summary-drawer-body">
            <MarkdownViewer content={current.content || ''} />
          </div>
        </aside>
      ) : null}

      {importOpen ? (
        <SummaryImportModal
          onClose={() => setImportOpen(false)}
          onImported={async () => {
            setImportOpen(false);
            await loadDocs();
          }}
        />
      ) : null}
    </PageContainer>
  );
}

function SummaryImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SummaryImportPreview | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [summaryType, setSummaryType] = useState<'command' | 'log_problem'>('command');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handlePreview() {
    if (!file) {
      setError('请选择 .devai-summary.json 文件。');
      return;
    }
    setError('');
    try {
      const data = await previewSummaryImport(file);
      setPreview(data);
      const summary = data.summaryInFile || data.items?.[0];
      setSummaryType(summary?.summaryType === 'log_problem' ? 'log_problem' : 'command');
      setTitle(summary?.title || '');
      setTags((summary?.tags || []).join(','));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleConfirm() {
    if (!file || !project || !scene) {
      setError('请先选择文件、项目和场景。');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await confirmSummaryImport({
        file,
        projectId: project.id,
        sceneId: scene.id,
        summaryType,
        title,
        tags,
        allowDuplicate,
      });
      onImported();
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      if (message.includes('重复')) {
        setAllowDuplicate(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal import-modal" role="dialog" aria-modal="true" aria-label="导入总结文档">
        <div className="modal-header">
          <h2>导入总结文档</h2>
          <button className="icon-button" type="button" title="关闭" onClick={onClose}>
            ×
          </button>
        </div>
        <label>
          导入文件
          <input
            type="file"
            accept=".json,.devai-summary.json,application/json"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setPreview(null);
            }}
          />
        </label>
        <button className="action-button" type="button" onClick={handlePreview}>
          解析文件
        </button>
        {preview ? (
          <div className="import-preview">
            <p className="muted">文件项目：{preview.projectInFile?.name || '-'}</p>
            <p className="muted">文件场景：{preview.sceneInFile?.name || '-'}</p>
            <ProjectPicker value={project?.id} onChange={setProject} allowCreate />
            <ScenePicker projectId={project?.id} value={scene?.id} onChange={setScene} allowCreate />
            <label>
              总结类型
              <select value={summaryType} onChange={(event) => setSummaryType(event.target.value as 'command' | 'log_problem')}>
                <option value="command">命令总结</option>
                <option value="log_problem">日志问题总结</option>
              </select>
            </label>
            <label>
              标题
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              标签
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Docker,日志排查" />
            </label>
            <label className="checkbox-line">
              <input type="checkbox" checked={allowDuplicate} onChange={(event) => setAllowDuplicate(event.target.checked)} />
              仍然导入可能重复的文档
            </label>
          </div>
        ) : null}
        <ErrorBlock message={error} />
        <div className="modal-actions">
          <button className="action-button" type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" type="button" disabled={!preview || submitting} onClick={handleConfirm}>
            {submitting ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
}

function summaryTypeLabel(value?: string) {
  if (value === 'command') return '命令总结';
  if (value === 'log_problem') return '日志问题总结';
  return value || '-';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}
