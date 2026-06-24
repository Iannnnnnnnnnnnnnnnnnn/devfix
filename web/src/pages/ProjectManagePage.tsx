import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createProject, fetchProjects, fetchScenes } from '../api';
import DataTable, { type DataTableColumn } from '../components/common/DataTable';
import PageActionBar from '../components/common/PageActionBar';
import PageContainer from '../components/common/PageContainer';
import PageSearchPanel from '../components/common/PageSearchPanel';
import TablePagination from '../components/common/TablePagination';
import type { Project } from '../types';
import { ErrorBlock } from './shared';

interface SearchState {
  name: string;
  startTime: string;
  endTime: string;
}

const initialSearch: SearchState = { name: '', startTime: '', endTime: '' };

export default function ProjectManagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sceneCounts, setSceneCounts] = useState<Record<number, number>>({});
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError('');
    try {
      const list = await fetchProjects();
      setProjects(list);
      const entries = await Promise.all(
        list.map(async (project) => {
          try {
            const scenes = await fetchScenes(project.id);
            return [project.id, scenes.length] as const;
          } catch {
            return [project.id, 0] as const;
          }
        }),
      );
      setSceneCounts(Object.fromEntries(entries));
      setSelectedIds([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setError('项目名称不能为空。');
      return;
    }
    try {
      await createProject({ name: newName.trim(), description: newDescription.trim() });
      setNewName('');
      setNewDescription('');
      setModalOpen(false);
      await loadProjects();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
  }

  function handleReset() {
    setSearch(initialSearch);
    setPage(1);
  }

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (search.name.trim() && !project.name.toLowerCase().includes(search.name.trim().toLowerCase())) {
        return false;
      }
      if (search.startTime && (project.createdAt || '').slice(0, 10) < search.startTime) {
        return false;
      }
      if (search.endTime && (project.createdAt || '').slice(0, 10) > search.endTime) {
        return false;
      }
      return true;
    });
  }, [projects, search]);
  const pagedProjects = filtered.slice((page - 1) * pageSize, page * pageSize);
  const columns: Array<DataTableColumn<Project>> = [
    { key: 'index', title: '序号', width: 70, render: (_, index) => (page - 1) * pageSize + index + 1 },
    { key: 'name', title: '项目名称', width: 180, render: (project) => project.name },
    { key: 'description', title: '描述', render: (project) => project.description || '-' },
    { key: 'sceneCount', title: '场景数量', width: 100, render: (project) => sceneCounts[project.id] ?? project.sceneCount ?? 0 },
    { key: 'recordCount', title: '记录数量', width: 100, render: (project) => project.recordCount ?? '-' },
    { key: 'createdAt', title: '创建时间', width: 170, render: (project) => formatTime(project.createdAt) },
    { key: 'updatedAt', title: '更新时间', width: 170, render: (project) => formatTime(project.updatedAt) },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: () => (
        <div className="table-actions">
          <button className="table-action-link" type="button" onClick={() => setError('项目编辑接口暂未接入。')}>
            编辑
          </button>
          <button className="table-action-link" type="button" onClick={() => setError('请进入场景管理按项目筛选。')}>
            管理场景
          </button>
          <button className="table-action-link danger" type="button" onClick={() => setError('项目删除接口暂未接入。')}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="项目管理">
      <PageSearchPanel onSubmit={handleSearch}>
        <label>
          项目名称
          <input value={search.name} onChange={(event) => setSearch((current) => ({ ...current, name: event.target.value }))} />
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

      <PageActionBar stats={<span>总数：{filtered.length}</span>}>
        <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
          新增项目
        </button>
        <button
          className="action-button danger"
          type="button"
          onClick={() => setError(selectedIds.length ? '项目批量删除接口暂未接入。' : '请先勾选要删除的数据。')}
        >
          批量删除
        </button>
        <button className="action-button" type="button" onClick={() => void loadProjects()}>
          刷新
        </button>
      </PageActionBar>

      <ErrorBlock message={error} />
      <section className="admin-list-panel">
        <DataTable
          columns={columns}
          data={pagedProjects}
          emptyText="暂无项目"
          loading={loading}
          rowKey={(project) => project.id}
          selectedRowKeys={selectedIds}
          onSelectedRowKeysChange={setSelectedIds}
        />
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </section>

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-label="新增项目">
            <div className="modal-header">
              <h2>新增项目</h2>
              <button className="icon-button" type="button" title="关闭" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <label>
              项目名称
              <input value={newName} onChange={(event) => setNewName(event.target.value)} autoFocus />
            </label>
            <label>
              描述
              <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} />
            </label>
            <div className="modal-actions">
              <button className="action-button" type="button" onClick={() => setModalOpen(false)}>
                取消
              </button>
              <button className="primary-button" type="button" onClick={handleCreate}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}
