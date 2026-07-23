import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ExamSession } from '../api/types';

export function SessionReviewPage() {
  const { id } = useParams();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .getSession(id)
      .then(async (res) => {
        let sess = res.session;
        if (sess.status !== 'completed') {
          sess = await api.finishSession(id);
        }
        setSession(sess);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!session) return <p className="muted">Loading review…</p>;

  const score = session.score;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Session review</h1>
      <p className="muted">
        Mode: {session.mode}
        {score ? ` · Score ${score.correct}/${score.total} (${score.percent}%)` : null}
      </p>

      <div className="panel" style={{ marginTop: 12 }}>
        {session.questionNumbers.map((n) => {
          const result = session.results?.[String(n)];
          return (
            <div key={n} className="list-item">
              <div>
                <strong>Q{n}</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  Selected: {(result?.selected || []).join(', ') || '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {result?.correct ? (
                  <span className="badge ok">correct</span>
                ) : (
                  <span className="badge bad">wrong</span>
                )}
                <Link className="btn" to={`/questions/${n}?mode=study`}>
                  Review
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="toolbar" style={{ marginTop: 16 }}>
        <Link className="btn btn-primary" to="/">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
