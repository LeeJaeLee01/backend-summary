import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { UserNote } from '../api/types';

export function NotesIndexPage() {
  const [items, setItems] = useState<UserNote[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listNotes(1)
      .then((res) => setItems(res.items))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Notes</h1>
      <p className="muted">Questions with personal notes</p>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="panel" style={{ marginTop: 12 }}>
        {items.map((n) => (
          <Link key={n.questionNumber} className="list-item" to={`/questions/${n.questionNumber}`}>
            <div>
              <strong>Q{n.questionNumber}</strong> · {n.title || ''}
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {(n.body || '').slice(0, 160)}
                {(n.body || '').length > 160 ? '…' : ''}
              </div>
            </div>
          </Link>
        ))}
        {!items.length ? <div style={{ padding: 16 }} className="muted">No notes yet.</div> : null}
      </div>
    </div>
  );
}
