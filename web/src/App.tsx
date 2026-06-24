import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import AnalyzePage from './pages/AnalyzePage';
import BugArchivePage from './pages/BugArchivePage';
import BugDetailPage from './pages/BugDetailPage';
import BugNewPage from './pages/BugNewPage';
import CommandPage from './pages/CommandPage';
import DashboardPage from './pages/DashboardPage';
import DetailPage from './pages/DetailPage';
import HistoryPage from './pages/HistoryPage';
import ProjectManagePage from './pages/ProjectManagePage';
import SceneManagePage from './pages/SceneManagePage';
import SummaryPage from './pages/SummaryPage';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/analyze', label: '日志分析' },
  { to: '/command', label: '命令助手' },
  { to: '/history', label: '历史记录' },
  { to: '/summary', label: '总结文档' },
  { to: '/bug/archive', label: 'Bug 档案' },
  { to: '/bug/new', label: '新建 Bug' },
  { to: '/projects', label: '项目管理' },
  { to: '/scenes', label: '场景管理' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DF</div>
          <div>
            <h1>DevFix AI</h1>
            <span>本地开发排错助手</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/command" element={<CommandPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<DetailPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/bugs" element={<Navigate to="/bug/archive" replace />} />
          <Route path="/bug/archive" element={<BugArchivePage />} />
          <Route path="/bug/archive/:id" element={<BugDetailPage />} />
          <Route path="/bug/new" element={<BugNewPage />} />
          <Route path="/projects" element={<ProjectManagePage />} />
          <Route path="/scenes" element={<SceneManagePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
