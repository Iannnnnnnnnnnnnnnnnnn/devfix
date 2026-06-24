import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createScene, deleteScene, fetchProjects, fetchScenes, updateScene } from '../api';
import DataTable, { type DataTableColumn } from '../components/common/DataTable';
import PageActionBar from '../components/common/PageActionBar';
import PageContainer from '../components/common/PageContainer';
import PageSearchPanel from '../components/common/PageSearchPanel';
import TablePagination from '../components/common/TablePagination';
import type { Project, Scene } from '../types';
import { ErrorBlock } from './shared';

interface SearchState {
  projectId: string;
  name: string;
  startTime: string;
  endTime: string;
}

const initialSearch: SearchState = { projectId: '', name: '', startTime: '', endTime: '' };

export default function SceneManagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Scene | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects()
      .then((list) => {
        setProjects(list);
        return loadScenes(list);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function loadScenes(projectList = projects) {
    setLoading(true);
    setError('');
    try {
      const allScenes = (
        await Promise.all(
          projectList.map(async (project) => {
            try {
              const list = await fetchScenes(project.id);
              return list.map((scene) => ({ ...scene, projectName: project.name }));
            } catch {
              return [];
            }
          }),
        )
      ).flat();
      setScenes(allScenes);
      setSelectedIds([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormProjectId(search.projectId || '');
    setFormName('');
    setFormDescription('');
    setModalOpen(true);
  }

  function openEdit(scene: Scene) {
    setEditing(scene);
    setFormProjectId(String(scene.projectId));
    setFormName(scene.name);
    setFormDescription(scene.description || '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formProjectId || !formName.trim()) {
      setError('项目和场景名称不能为空。');
      return;
    }
    try {
      if (editing) {
        await updateScene(editing.id, { name: formName.trim(), description: formDescription.trim() });
      } else {
        await createScene(Number(formProjectId), { name: formName.trim(), description: formDescription.trim() });
      }
      setModalOpen(false);
      await loadScenes();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(scene: Scene) {
    if (!window.confirm(`确认删除场景「${scene.name}」？`)) {
      return;
    }
    try {
      await deleteScene(scene.id);
      await loadScenes();
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
    return scenes.filter((scene) => {
      if (search.projectId && scene.projectId !== Number(search.projectId)) {
        return false;
      }
      if (search.name.trim() && !scene.name.toLowerCase().includes(search.name.trim().toLowerCase())) {
        return false;
      }
      if (search.startTime && (scene.createdAt || '').slice(0, 10) < search.startTime) {
        return false;
      }
      if (search.endTime && (scene.createdAt || '').slice(0, 10) > search.endTime) {
        return false;
      }
      return true;
    });
  }, [scenes, search]);
  const pagedScenes = filtered.slice((page - 1) * pageSize, page * pageSize);
  const projectNameMap = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);
  const columns: Array<DataTableColumn<Scene>> = [
    { key: 'index', title: '序号', width: 70, render: (_, index) => (page - 1) * pageSize + index + 1 },
    { key: 'project', title: '项目', width: 160, render: (scene) => scene.projectName || projectNameMap.get(scene.projectId) || `项目 #${scene.projectId}` },
    { key: 'name', title: '场景名称', width: 180, render: (scene) => scene.name },
    { key: 'description', title: '描述', render: (scene) => scene.description || '-' },
    { key: 'logCount', title: '日志记录数', width: 110, render: (scene) => scene.logCount ?? '-' },
    { key: 'commandCount', title: '命令记录数', width: 110, render: (scene) => scene.commandCount ?? '-' },
    { key: 'summaryCount', title: '总结文档数', width: 110, render: (scene) => scene.summaryCount ?? '-' },
    { key: 'createdAt', title: '创建时间', width: 170, render: (scene) => formatTime(scene.createdAt) },
    { key: 'updatedAt', title: '更新时间', width: 170, render: (scene) => formatTime(scene.updatedAt) },
    {
      key: 'actions',
      title: '操作',
      width: 160,
      render: (scene) => (
        <div className="table-actions">
          <button className="table-action-link" type="button" onClick={() => openEdit(scene)}>
            编辑
          </button>
          <button className="table-action-link" type="button" onClick={() => setError('请到历史记录或总结文档页按场景筛选查看。')}>
            查看记录
          </button>
          <button className="table-action-link danger" type="button" onClick={() => handleDelete(scene)}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="场景管理">
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
          场景名称
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
        <button className="primary-button" type="button" onClick={openCreate}>
          新增场景
        </button>
        <button
          className="action-button danger"
          type="button"
          onClick={() => setError(selectedIds.length ? '场景批量删除接口暂未接入。' : '请先勾选要删除的数据。')}
        >
          批量删除
        </button>
        <button className="action-button" type="button" onClick={() => void loadScenes()}>
          刷新
        </button>
      </PageActionBar>

      <ErrorBlock message={error} />
      <section className="admin-list-panel">
        <DataTable
          columns={columns}
          data={pagedScenes}
          emptyText="暂无场景"
          loading={loading}
          rowKey={(scene) => scene.id}
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
          <div className="modal" role="dialog" aria-modal="true" aria-label={editing ? '编辑场景' : '新增场景'}>
            <div className="modal-header">
              <h2>{editing ? '编辑场景' : '新增场景'}</h2>
              <button className="icon-button" type="button" title="关闭" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <label>
              项目
              <select value={formProjectId} disabled={Boolean(editing)} onChange={(event) => setFormProjectId(event.target.value)}>
                <option value="">请选择项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              场景名称
              <input value={formName} onChange={(event) => setFormName(event.target.value)} autoFocus />
            </label>
            <label>
              描述
              <textarea value={formDescription} onChange={(event) => setFormDescription(event.target.value)} rows={3} />
            </label>
            <div className="modal-actions">
              <button className="action-button" type="button" onClick={() => setModalOpen(false)}>
                取消
              </button>
              <button className="primary-button" type="button" onClick={handleSave}>
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
