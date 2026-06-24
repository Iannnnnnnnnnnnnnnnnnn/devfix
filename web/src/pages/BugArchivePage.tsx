import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteBugIssue, fetchBugIssues, fetchProjects, fetchScenes } from '../api';
import DataTable, { type DataTableColumn } from '../components/common/DataTable';
import PageActionBar from '../components/common/PageActionBar';
import PageContainer from '../components/common/PageContainer';
import PageSearchPanel from '../components/common/PageSearchPanel';
import StatusTag from '../components/common/StatusTag';
import TablePagination from '../components/common/TablePagination';
import type { BugIssue, Project, Scene } from '../types';
import { ErrorBlock } from './shared';

const statuses = [
  { value: 'open', label: '排查中' },
  { value: 'resolved', label: '已解决' },
  { value: 'archived', label: '已归档' },
];

interface SearchState {
  projectId: string;
  sceneId: string;
  keyword: string;
  status: string;
  errorType: string;
  tag: string;
}

const initialSearch: SearchState = {
  projectId: '',
  sceneId: '',
  keyword: '',
  status: '',
  errorType: '',
  tag: '',
};

export default function BugArchivePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [issues, setIssues] = useState<BugIssue[]>([]);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
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
    void loadArchive();
  }, [page, pageSize]);

  async function loadArchive(overrides: Partial<SearchState> = {}) {
    const state = { ...search, ...overrides };
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (state.projectId) params.set('projectId', state.projectId);
      if (state.sceneId) params.set('sceneId', state.sceneId);
      if (state.keyword.trim()) params.set('keyword', state.keyword.trim());
      if (state.status) params.set('status', state.status);
      if (state.errorType.trim()) params.set('errorType', state.errorType.trim());
      if (state.tag.trim()) params.set('tag', state.tag.trim());
      const data = await fetchBugIssues(params);
      setIssues(data.list || []);
      setTotal(data.total || 0);
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
    void loadArchive();
  }

  function handleReset() {
    setSearch(initialSearch);
    setPage(1);
    void loadArchive(initialSearch);
  }

  async function handleDeleteIssue(id: number) {
    if (!window.confirm('确认删除该 Bug 问题及其排查记录？')) {
      return;
    }
    try {
      await deleteBugIssue(id);
      await loadArchive();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const columns: Array<DataTableColumn<BugIssue>> = [
    {
      key: 'index',
      title: '序号',
      width: 70,
      render: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: 'issueName',
      title: '问题名称',
      width: 220,
      render: (issue) => (
        <Link className="table-link" to={`/bug/archive/${issue.id}`}>
          {issue.issueName}
        </Link>
      ),
    },
    { key: 'project', title: '项目', width: 140, render: (issue) => issue.projectName || '-' },
    { key: 'scene', title: '场景', width: 140, render: (issue) => issue.sceneName || '-' },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (issue) => <StatusTag tone={statusTone(issue.status)}>{statusLabel(issue.status)}</StatusTag>,
    },
    { key: 'errorType', title: '错误类型', width: 150, render: (issue) => issue.errorType || '-' },
    { key: 'tags', title: '标签', width: 160, render: (issue) => <TagList tags={issue.tags} /> },
    { key: 'summary', title: '摘要', className: 'summary-cell', render: (issue) => issue.summary || '-' },
    { key: 'updatedAt', title: '更新时间', width: 170, render: (issue) => formatTime(issue.updatedAt) },
    {
      key: 'actions',
      title: '操作',
      width: 170,
      render: (issue) => (
        <div className="table-actions">
          <Link className="table-action-link" to={`/bug/archive/${issue.id}`}>
            查看详情
          </Link>
          <Link className="table-action-link" to={`/bug/new?issueId=${issue.id}`}>
            编辑
          </Link>
          <button className="table-action-link danger" type="button" onClick={() => handleDeleteIssue(issue.id)}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Bug 档案" description="只做查询和查看，新建 Bug 使用独立页面。">
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
            placeholder="问题名、摘要、排查内容"
          />
        </label>
        <label>
          状态
          <select value={search.status} onChange={(event) => setSearch((current) => ({ ...current, status: event.target.value }))}>
            <option value="">全部状态</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          错误类型
          <input
            value={search.errorType}
            onChange={(event) => setSearch((current) => ({ ...current, errorType: event.target.value }))}
            placeholder="Spring Boot 启动失败"
          />
        </label>
        <label>
          标签
          <input
            value={search.tag}
            onChange={(event) => setSearch((current) => ({ ...current, tag: event.target.value }))}
            placeholder="端口占用"
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
        <button className="action-button" type="button" onClick={() => void loadArchive()}>
          刷新
        </button>
      </PageActionBar>

      <ErrorBlock message={error} />
      <section className="admin-list-panel">
        <DataTable
          columns={columns}
          data={issues}
          emptyText="暂无 Bug 档案"
          loading={loading}
          rowKey={(issue) => issue.id}
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
}

function TagList({ tags }: { tags?: string[] }) {
  const list = tags || [];
  if (!list.length) {
    return <span>-</span>;
  }
  return (
    <div className="tag-list">
      {list.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function statusLabel(value?: string) {
  return statuses.find((item) => item.value === value)?.label || value || '-';
}

function statusTone(value?: string) {
  if (value === 'resolved') return 'green';
  if (value === 'archived') return 'gray';
  return 'blue';
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}
