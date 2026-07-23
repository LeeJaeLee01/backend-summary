import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { NotesIndexPage } from './pages/NotesIndexPage';
import { QuestionListPage } from './pages/QuestionListPage';
import { QuizPlayerPage } from './pages/QuizPlayerPage';
import { SessionReviewPage } from './pages/SessionReviewPage';
import { SessionRunnerPage } from './pages/SessionRunnerPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="questions" element={<QuestionListPage />} />
        <Route path="questions/:number" element={<QuizPlayerPage />} />
        <Route path="sessions/:id" element={<SessionRunnerPage />} />
        <Route path="sessions/:id/review" element={<SessionReviewPage />} />
        <Route path="notes" element={<NotesIndexPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
