import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Preferences } from '../api/types';

export function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMe()
      .then((res) => setPrefs(res.user.preferences))
      .catch((e) => setError(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    try {
      const res = await api.updatePreferences(prefs);
      setPrefs(res.user.preferences);
      setMessage('Saved');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  if (!prefs) {
    return error ? <div className="error-banner">{error}</div> : <p className="muted">Loading…</p>;
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <p className="muted">{message}</p> : null}

      <form className="panel" style={{ padding: 16, maxWidth: 480 }} onSubmit={save}>
        <label className="field">
          Default mode
          <select
            value={prefs.defaultMode}
            onChange={(e) =>
              setPrefs({ ...prefs, defaultMode: e.target.value as Preferences['defaultMode'] })
            }
          >
            <option value="practice">Practice</option>
            <option value="study">Study</option>
            <option value="exam">Exam</option>
          </select>
        </label>
        <label className="field">
          Exam question count
          <input
            type="number"
            min={1}
            max={200}
            value={prefs.examQuestionCount}
            onChange={(e) =>
              setPrefs({ ...prefs, examQuestionCount: Number(e.target.value) || 65 })
            }
          />
        </label>
        <label className="field">
          Exam minutes
          <input
            type="number"
            min={5}
            max={300}
            value={prefs.examMinutes}
            onChange={(e) => setPrefs({ ...prefs, examMinutes: Number(e.target.value) || 130 })}
          />
        </label>
        <label className="field">
          Resume question number
          <input
            type="number"
            min={1}
            value={prefs.lastQuestionNumber}
            onChange={(e) =>
              setPrefs({ ...prefs, lastQuestionNumber: Number(e.target.value) || 1 })
            }
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Save preferences
        </button>
      </form>
    </div>
  );
}
