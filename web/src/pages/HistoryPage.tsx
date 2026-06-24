import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  deleteHistory,
  fetchCommandHistory,
  fetchLogHistory,
  fetchProjects,
  fetchScenes,
  generateCommandSummary,
  generateLogSummary,
} from '../api';
import DataTable, { type DataTableColumn } from '../components/common/DataTable';
import PageActionBar from '../components/common/PageActionBar';
import PageContainer from '../components/common/PageContainer';
import PageSearchPanel from '../components/common/PageSearchPanel';
import StatusTag from '../components/common/StatusTag';
import TablePagination from '../components/common/TablePagination';
import type { CommandHistoryItem, LogHistoryItem, Project, Scene } from '../types';
import { ErrorBlock } from './shared';

type TabKey = 'logs' | 'commands';

interface SearchState {
  projectId: string;
  sceneId: string;
  keyword: string;
  errorType: string;
  startTime: string;
  endTime: string;
}

const initialSearch: SearchState = {
  projectId: '',
  sceneId: '',
  keyword: '',
  errorType: '',
  startTime: '',
  endTime: '',
};

export default function HistoryPage() {
  const [tab, setTab] = useState<TabKey>('logs');
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [logHistory, setLogHistory] = useState<LogHistoryItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
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
    void loadHistory();
  }, [tab, page, pageSize]);

  async function loadHistory(overrides: Partial<SearchState> = {}) {
    const state = { ...search, ...overrides };
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (state.projectId) params.set('projectId', state.projectId);
      if (state.sceneId) params.set('sceneId', state.sceneId);
      if (state.keyword.trim()) params.set('keyword', state.keyword.trim());
      if (state.startTime) params.set('startTime', `${state.startTime}T00:00:00`);
      if (state.endTime) params.set('endTime', `${state.endTime}T23:59:59`);
      if (tab === 'logs' && state.errorType.trim()) params.set('errorType', state.errorType.trim());
      const data = tab === 'logs' ? await fetchLogHistory(params) : await fetchCommandHistory(params);
      if (tab === 'logs') {
        setLogHistory(data.list as LogHistoryItem[]);
      } else {
        setCommandHistory(data.list as CommandHistoryItem[]);
      }
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
    void loadHistory();
  }

  function handleReset() {
    setSearch(initialSearch);
    setPage(1);
    void loadHistory(initialSearch);
  }

  async function handleDelete(id: number) {
    if (!window.confirm('确认删除该历史记录？')) {
      return;
    }
    try {
      await deleteHistory(id);
      await loadHistory();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleGenerateSummary() {
    if (!search.projectId) {
      setError('请先选择项目后再生成总结。');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const payload = { projectId: Number(search.projectId), sceneId: search.sceneId ? Number(search.sceneId) : undefined };
      if (tab === 'logs') {
        await generateLogSummary(payload);
      } else {
        await generateCommandSummary(payload);
      }
      setError(tab === 'logs' ? '日志问题总结已生成，可到总结文档查看。' : '命令总结已生成，可到总结文档查看。');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const projectNameMap = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);
  const sceneNameMap = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene.name])), [scenes]);
  const activeList = tab === 'logs' ? logHistory : commandHistory;
  const columns = tab === 'logs' ? logColumns(projectNameMap, sceneNameMap, page, pageSize, handleDelete) : commandColumns(projectNameMap, sceneNameMap, page, pageSize, handleDelete);

  return (
    <PageContainer title={tab === 'logs' ? '日志分析历史' : '命令助手历史'}>
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
          关键词
          <input
            value={search.keyword}
            onChange={(event) => setSearch((current) => ({ ...current, keyword: event.target.value }))}
            placeholder={tab === 'logs' ? '摘要、问题或日志' : '命令问题、关键词'}
          />
        </label>
        {tab === 'logs' ? (
          <label>
            错误类型
            <input
              value={search.errorType}
              onChange={(event) => setSearch((current) => ({ ...current, errorType: event.target.value }))}
              placeholder="Spring Boot 启动失败"
            />
          </label>
        ) : null}
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
        <button className={tab === 'logs' ? 'primary-button' : 'action-button'} type="button" onClick={() => switchTab('logs')}>
          日志分析历史
        </button>
        <button className={tab === 'commands' ? 'primary-button' : 'action-button'} type="button" onClick={() => switchTab('commands')}>
          命令助手历史
        </button>
        <button className="action-button" type="button" onClick={() => setError('导出接口暂未接入。')}>
          导出
        </button>
        <button
          className="action-button danger"
          type="button"
          onClick={() => setError(selectedIds.length ? '批量删除接口暂未接入。' : '请先勾选要删除的数据。')}
        >
          批量删除
        </button>
        <button className="action-button" type="button" disabled={generating} onClick={handleGenerateSummary}>
          {generating ? '生成中...' : tab === 'logs' ? '手动生成日志问题总结' : '手动生成命令总结'}
        </button>
        <button className="action-button" type="button" onClick={() => void loadHistory()}>
          刷新
        </button>
      </PageActionBar>

      <ErrorBlock message={error} />
      <section className="admin-list-panel">
        <DataTable
          columns={columns}
          data={activeList}
          emptyText={tab === 'logs' ? '暂无日志分析历史' : '暂无命令助手历史'}
          loading={loading}
          rowKey={(item) => item.id}
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
    </PageContainer>
  );

  function switchTab(nextTab: TabKey) {
    setTab(nextTab);
    setPage(1);
    setSelectedIds([]);
  }
}

function logColumns(
  projectNameMap: Map<number, string>,
  sceneNameMap: Map<number, string>,
  page: number,
  pageSize: number,
  onDelete: (id: number) => void,
): Array<DataTableColumn<LogHistoryItem>> {
  return [
    { key: 'index', title: '序号', width: 70, render: (_, index) => (page - 1) * pageSize + index + 1 },
    { key: 'project', title: '项目', width: 140, render: (item) => projectNameMap.get(item.projectId) || `项目 #${item.projectId}` },
    { key: 'scene', title: '场景', width: 140, render: (item) => sceneNameMap.get(item.sceneId) || `场景 #${item.sceneId}` },
    { key: 'errorType', title: '错误类型', width: 150, render: (item) => item.errorType || '-' },
    { key: 'summary', title: '摘要', className: 'summary-cell', render: (item) => item.summary || item.question || '-' },
    { key: 'source', title: '来源', width: 100, render: (item) => <StatusTag>{item.source || 'web'}</StatusTag> },
    { key: 'model', title: '模型', width: 120, render: (item) => item.modelName || '-' },
    { key: 'createdAt', title: '创建时间', width: 170, render: (item) => formatTime(item.createdAt) },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (item) => (
        <div className="table-actions">
          <button className="table-action-link" type="button" onClick={() => window.alert(item.summary || item.question || '暂无详情')}>
            查看详情
          </button>
          <button className="table-action-link" type="button" onClick={() => window.alert('请使用操作栏按项目/场景生成总结。')}>
            生成总结
          </button>
          <button className="table-action-link danger" type="button" onClick={() => onDelete(item.id)}>
            删除
          </button>
        </div>
      ),
    },
  ];
}

function commandColumns(
  projectNameMap: Map<number, string>,
  sceneNameMap: Map<number, string>,
  page: number,
  pageSize: number,
  onDelete: (id: number) => void,
): Array<DataTableColumn<CommandHistoryItem>> {
  return [
    { key: 'index', title: '序号', width: 70, render: (_, index) => (page - 1) * pageSize + index + 1 },
    { key: 'project', title: '项目', width: 140, render: (item) => projectNameMap.get(item.projectId) || `项目 #${item.projectId}` },
    { key: 'scene', title: '场景', width: 140, render: (item) => sceneNameMap.get(item.sceneId) || `场景 #${item.sceneId}` },
    { key: 'question', title: '命令问题', width: 220, render: (item) => item.question || item.keyword || '-' },
    { key: 'summary', title: '摘要', className: 'summary-cell', render: (item) => item.summary || '-' },
    { key: 'source', title: '来源', width: 100, render: (item) => <StatusTag>{item.source || 'web-cmd'}</StatusTag> },
    { key: 'model', title: '模型', width: 120, render: (item) => item.modelName || '-' },
    { key: 'createdAt', title: '创建时间', width: 170, render: (item) => formatTime(item.createdAt) },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (item) => (
        <div className="table-actions">
          <button className="table-action-link" type="button" onClick={() => window.alert(item.summary || item.question || '暂无详情')}>
            查看详情
          </button>
          <button className="table-action-link" type="button" onClick={() => window.alert('请使用操作栏按项目/场景生成总结。')}>
            生成总结
          </button>
          <button className="table-action-link danger" type="button" onClick={() => onDelete(item.id)}>
            删除
          </button>
        </div>
      ),
    },
  ];
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}
