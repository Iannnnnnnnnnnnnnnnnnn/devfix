import { FormEvent, useState } from 'react';
import { recommendCommand } from '../api';
import MarkdownViewer from '../components/markdown/MarkdownViewer';
import type { CommandSearchResponse, Project, Scene } from '../types';
import { EmptyBlock, ErrorBlock, ProjectPicker, ScenePicker, SimpleCommandList } from './shared';

export default function CommandPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<CommandSearchResponse | null>(null);
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
      const data = await recommendCommand({
        projectId: project.id,
        sceneId: scene.id,
        keyword: question,
        question,
        source: 'web-cmd',
      });
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
          <h1>命令助手</h1>
        </div>
      </header>
      <form className="form-panel" onSubmit={handleSubmit}>
        <ProjectPicker value={project?.id} onChange={setProject} allowCreate />
        <ScenePicker projectId={project?.id} value={scene?.id} onChange={setScene} allowCreate />
        <label>
          自然语言需求
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例如：查看 nginx 最近 200 行错误日志"
            rows={5}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? '推荐中...' : '推荐命令'}
        </button>
      </form>
      <ErrorBlock message={error} />
      {result ? (
        <section className="panel full">
          <h2>{result.scenario || '推荐命令'}</h2>
          {result.historyId ? <p className="muted">历史记录 ID：{result.historyId}</p> : null}
          <SimpleCommandList commands={result.commands} />
          <div className="command-tips">
            <h2>补充说明</h2>
            {result.tips?.length ? (
              result.tips.map((tip, index) => <MarkdownViewer content={tip} key={`${tip}-${index}`} />)
            ) : (
              <EmptyBlock text="暂无内容" />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
