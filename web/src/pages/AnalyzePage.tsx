import { FormEvent, useState } from 'react';
import { analyzeLog } from '../api';
import type { AnalyzeCliResponse, Project, Scene } from '../types';
import { CliAnalyzeReport, ErrorBlock, ProjectPicker, ScenePicker } from './shared';

export default function AnalyzePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [logContent, setLogContent] = useState('');
  const [result, setResult] = useState<AnalyzeCliResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!project) {
      setError('请先选择项目 / 技术域。');
      return;
    }
    if (!scene) {
      setError('请先选择场景。');
      return;
    }
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const data = await analyzeLog({ projectId: project.id, sceneId: scene.id, content: logContent, source: 'web' });
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>日志分析</h1>
        </div>
      </header>
      <form className="form-panel" onSubmit={handleSubmit}>
        <ProjectPicker value={project?.id} onChange={setProject} allowCreate />
        <ScenePicker projectId={project?.id} value={scene?.id} onChange={setScene} allowCreate />
        <label>
          报错日志
          <textarea
            value={logContent}
            onChange={(event) => setLogContent(event.target.value)}
            placeholder="粘贴异常堆栈、容器日志、Nginx/MySQL/Redis/Git 报错..."
            rows={14}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? '分析中...' : '开始分析'}
        </button>
      </form>
      <ErrorBlock message={error} />
      {result ? <CliAnalyzeReport result={result} /> : null}
    </div>
  );
}
