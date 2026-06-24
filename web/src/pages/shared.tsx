import { useEffect, useState } from 'react';
import { createProject, createScene, fetchProjects, fetchScenes } from '../api';
import MarkdownViewer from '../components/markdown/MarkdownViewer';
import type { AnalyzeCliResponse, CommandItem, CommandSearchItem, DiagnosisResponse, Project, Scene } from '../types';

export function RiskTag({ level }: { level: string }) {
  const normalized = level || 'safe';
  return <span className={`risk-tag risk-${normalized}`}>{normalized}</span>;
}

export function LoadingBlock({ text = '加载中...' }: { text?: string }) {
  return <div className="state-block">{text}</div>;
}

export function ErrorBlock({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return <div className="error-block">{message}</div>;
}

export function EmptyBlock({ text }: { text: string }) {
  return <div className="state-block">{text}</div>;
}

export function CommandList({ commands }: { commands: CommandItem[] }) {
  if (!commands?.length) {
    return <EmptyBlock text="暂无推荐命令" />;
  }
  return (
    <div className="command-list">
      {commands.map((item, index) => (
        <div className="command-card" key={`${item.command}-${index}`}>
          <div className="command-meta">
            <RiskTag level={item.riskLevel} />
            <span>{item.readonly ? '只读' : '可能修改系统'}</span>
          </div>
          {item.command ? <pre>{item.command}</pre> : <pre>无可执行命令</pre>}
          <MarkdownViewer content={item.description} />
        </div>
      ))}
    </div>
  );
}

export function SimpleCommandList({ commands }: { commands?: CommandSearchItem[] }) {
  const list = commands || [];
  if (!list.length) {
    return <EmptyBlock text="暂无推荐命令" />;
  }
  return (
    <div className="command-list">
      {list.map((item, index) => (
        <div className="command-card" key={`${item.command}-${index}`}>
          {item.command ? <pre>{item.command}</pre> : <pre>无可执行命令</pre>}
          <MarkdownViewer content={item.description || ''} />
          {item.example ? (
            <div className="command-example">
              <span className="muted">示例</span>
              <MarkdownViewer content={item.example} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ProjectPicker({
  value,
  onChange,
  allowCreate = false,
}: {
  value?: number;
  onChange: (project: Project) => void;
  allowCreate?: boolean;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then((list) => {
        setProjects(list);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) {
      return;
    }
    setCreating(true);
    setError('');
    try {
      const project = await createProject({ name, description: newDescription.trim() });
      setProjects((current) => {
        if (current.some((item) => item.id === project.id)) {
          return current;
        }
        return [...current, project];
      });
      setNewName('');
      setNewDescription('');
      setShowCreate(false);
      onChange(project);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="project-picker">
      <label>
        <span className="field-label">
          <span>项目 / 技术域</span>
          {allowCreate ? (
            <button className="icon-button" type="button" title="新建项目" onClick={() => setShowCreate(true)}>
              +
            </button>
          ) : null}
        </span>
        <select
          value={value || ''}
          onChange={(event) => {
            const project = projects.find((item) => item.id === Number(event.target.value));
            if (project) {
              onChange(project);
            }
          }}
          required
        >
          <option value="">请选择项目 / 技术域</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {showCreate ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-label="新建项目">
            <div className="modal-header">
              <h2>新建项目</h2>
              <button className="icon-button" type="button" title="关闭" onClick={() => setShowCreate(false)}>
                ×
              </button>
            </div>
            <label>
              项目名称
              <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="DevAI" autoFocus />
            </label>
            <label>
              项目描述
              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="可选"
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button className="action-button" type="button" onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button className="primary-button" type="button" disabled={creating || !newName.trim()} onClick={handleCreate}>
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ErrorBlock message={error} />
    </div>
  );
}

export function ScenePicker({
  projectId,
  value,
  onChange,
  allowCreate = false,
}: {
  projectId?: number;
  value?: number;
  onChange: (scene: Scene | null) => void;
  allowCreate?: boolean;
}) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setScenes([]);
    onChange(null);
    if (!projectId) {
      return;
    }
    fetchScenes(projectId)
      .then(setScenes)
      .catch((err: Error) => setError(err.message));
  }, [projectId]);

  async function handleCreate() {
    if (!projectId || !newName.trim()) {
      return;
    }
    setCreating(true);
    setError('');
    try {
      const scene = await createScene(projectId, { name: newName.trim(), description: newDescription.trim() });
      setScenes((current) => (current.some((item) => item.id === scene.id) ? current : [...current, scene]));
      setNewName('');
      setNewDescription('');
      setShowCreate(false);
      onChange(scene);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="project-picker">
      <label>
        <span className="field-label">
          <span>场景</span>
          {allowCreate && projectId ? (
            <button className="icon-button" type="button" title="新建场景" onClick={() => setShowCreate(true)}>
              +
            </button>
          ) : null}
        </span>
        <select
          value={value || ''}
          onChange={(event) => {
            const scene = scenes.find((item) => item.id === Number(event.target.value));
            onChange(scene || null);
          }}
          disabled={!projectId}
          required
        >
          <option value="">{projectId ? '请选择场景' : '请先选择项目 / 技术域'}</option>
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      </label>
      {projectId && !scenes.length ? <p className="muted">当前项目 / 技术域下还没有场景，请新建场景。</p> : null}
      {showCreate ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-label="新建场景">
            <div className="modal-header">
              <h2>新建场景</h2>
              <button className="icon-button" type="button" title="关闭" onClick={() => setShowCreate(false)}>
                ×
              </button>
            </div>
            <label>
              场景名称
              <input value={newName} onChange={(event) => setNewName(event.target.value)} autoFocus />
            </label>
            <label>
              场景说明
              <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} />
            </label>
            <div className="modal-actions">
              <button className="action-button" type="button" onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button className="primary-button" type="button" disabled={creating || !newName.trim()} onClick={handleCreate}>
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ErrorBlock message={error} />
    </div>
  );
}

export function CliAnalyzeReport({ result }: { result: AnalyzeCliResponse }) {
  return (
    <div className="report-grid">
      <section className="panel full">
        <h2>报错结论</h2>
        <p className="large-text">{result.errorType || '暂无结论'}</p>
        {result.historyId ? <p className="muted">历史记录 ID：{result.historyId}</p> : null}
      </section>
      <section className="panel full">
        <h2>最可能原因</h2>
        <MarkdownViewer content={result.cause || ''} />
      </section>
      <ListPanel title="关键错误行" items={result.keyLines || []} />
      <ListPanel title="解决方案" items={result.solution || []} ordered />
      <ListPanel title="推荐命令" items={result.commands || []} />
      <ListPanel title="相关知识点" items={result.knowledge || []} />
    </div>
  );
}

export function DiagnosisReport({ result }: { result: DiagnosisResponse }) {
  return (
    <div className="report-grid">
      <section className="panel full">
        <h2>报错结论</h2>
        <MarkdownViewer content={result.summary || ''} className="large-markdown" />
      </section>
      <section className="panel full">
        <h2>最可能原因</h2>
        <MarkdownViewer content={result.rootCause || ''} />
      </section>
      <ListPanel title="关键证据" items={result.evidence} />
      <section className="panel">
        <h2>建议排查命令</h2>
        <CommandList commands={result.commands} />
      </section>
      <ListPanel title="修复步骤" items={result.fixSteps} ordered />
      <ListPanel title="风险提醒" items={result.warnings} />
      <ListPanel title="还需要补充的信息" items={result.needMoreInfo} />
    </div>
  );
}

function ListPanel({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const safeItems = items || [];
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <section className="panel">
      <h2>{title}</h2>
      {safeItems.length ? (
        <ListTag className="item-list">
          {safeItems.map((item, index) => (
            <li key={`${title}-${index}`}>
              <MarkdownViewer content={item} />
            </li>
          ))}
        </ListTag>
      ) : (
        <EmptyBlock text="暂无内容" />
      )}
    </section>
  );
}
