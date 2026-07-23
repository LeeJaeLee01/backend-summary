import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Stats, User } from '../api/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
        setStats(res.stats);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function startMode(mode: 'practice' | 'study' | 'exam') {
    try {
      setBusy(true);
      if (mode === 'exam') {
        const session = await api.createSession({ mode: 'exam' });
        navigate(`/sessions/${session._id}`);
        return;
      }
      // Practice/Study: open quiz player (avoid loading all 684 into one session)
      navigate(`/questions/${lastQ}?mode=${mode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session');
    } finally {
      setBusy(false);
    }
  }

  const lastQ = user?.preferences?.lastQuestionNumber || 1;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Study dashboard</h1>
      <p className="muted">Default learner · bilingual EN-primary · practice / study / exam</p>
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="grid-stats" style={{ margin: '20px 0' }}>
        <div className="panel stat-card">
          <div className="label">Questions</div>
          <div className="value">{stats?.totalQuestions ?? '—'}</div>
        </div>
        <div className="panel stat-card">
          <div className="label">Accuracy</div>
          <div className="value">{stats?.accuracy == null ? '—' : `${stats.accuracy}%`}</div>
        </div>
        <div className="panel stat-card">
          <div className="label">Bookmarked</div>
          <div className="value">{stats?.bookmarked ?? '—'}</div>
        </div>
        <div className="panel stat-card">
          <div className="label">Streak</div>
          <div className="value">{stats?.streakDays ?? 0}d</div>
        </div>
        <div className="panel stat-card">
          <div className="label">Notes</div>
          <div className="value">{stats?.withNotes ?? 0}</div>
        </div>
        <div className="panel stat-card">
          <div className="label">Wrong</div>
          <div className="value">{stats?.answeredWrong ?? 0}</div>
        </div>
      </div>

      <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="toolbar">
          <button className="btn btn-primary" disabled={busy} onClick={() => startMode('practice')}>
            Start Practice
          </button>
          <button className="btn" disabled={busy} onClick={() => startMode('study')}>
            Start Study
          </button>
          <button className="btn" disabled={busy} onClick={() => startMode('exam')}>
            Timed Exam
          </button>
          <Link className="btn" to={`/questions/${lastQ}`}>
            Continue Q{lastQ}
          </Link>
          <Link className="btn btn-ghost" to="/questions">
            Browse all
          </Link>
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Reset toàn bộ câu đã làm? Bookmark/flag/note vẫn giữ.')) return;
              try {
                setBusy(true);
                await api.resetAllProgress();
                const res = await api.getMe();
                setUser(res.user);
                setStats(res.stats);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Reset failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Reset tiến độ
          </button>
        </div>
      </div>
    </div>
  );
}
