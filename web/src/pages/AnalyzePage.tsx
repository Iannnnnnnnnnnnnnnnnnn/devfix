import { FormEvent, useState } from 'react';
import { analyzeLog } from '../api';
import type { DiagnosisResponse } from '../types';
import { DiagnosisReport, ErrorBlock } from './shared';

const errorTypes = ['spring', 'docker', 'nginx', 'mysql', 'redis', 'git', 'linux', 'frontend', 'other'];
const environments = ['local', 'dev', 'test', 'prod'];

export default function AnalyzePage() {
  const [projectName, setProjectName] = useState('');
  const [errorType, setErrorType] = useState('spring');
  const [environment, setEnvironment] = useState('local');
  const [logContent, setLogContent] = useState('');
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const data = await analyzeLog({ projectName, errorType, environment, logContent });
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
          <p className="eyebrow">Analyze</p>
          <h1>日志分析</h1>
        </div>
      </header>
      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            项目名称
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="lifelink" />
          </label>
          <label>
            报错类型
            <select value={errorType} onChange={(event) => setErrorType(event.target.value)}>
              {errorTypes.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            环境
            <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
              {environments.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
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
      {result ? <DiagnosisReport result={result} /> : null}
    </div>
  );
}
