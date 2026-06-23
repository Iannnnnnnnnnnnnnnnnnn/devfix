import { FormEvent, useState } from 'react';
import { recommendCommand } from '../api';
import type { CommandItem } from '../types';
import { CommandList, ErrorBlock } from './shared';

export default function CommandPage() {
  const [question, setQuestion] = useState('');
  const [environment, setEnvironment] = useState('linux');
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setCommands([]);
    setSubmitting(true);
    try {
      const data = await recommendCommand({ question, environment });
      setCommands(data.commands);
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
          <p className="eyebrow">Command</p>
          <h1>Linux 命令助手</h1>
        </div>
      </header>
      <form className="form-panel" onSubmit={handleSubmit}>
        <label>
          环境
          <input value={environment} onChange={(event) => setEnvironment(event.target.value)} placeholder="linux" />
        </label>
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
      {commands.length ? (
        <section className="panel full">
          <h2>推荐命令</h2>
          <CommandList commands={commands} />
        </section>
      ) : null}
    </div>
  );
}
