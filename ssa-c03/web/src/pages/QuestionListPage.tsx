import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Question } from '../api/types';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'unseen', label: 'Unseen', status: 'unseen' },
  { key: 'wrong', label: 'Wrong', status: 'answered_wrong' },
  { key: 'correct', label: 'Correct', status: 'answered_correct' },
  { key: 'bookmarked', label: 'Bookmarked', bookmarked: 'true' },
  { key: 'flagged', label: 'Flagged', flagged: 'true' },
] as const;

export function QuestionListPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') || '';
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);

  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(q);

  useEffect(() => {
    const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
    const query: Record<string, string | number | undefined> = {
      page,
      limit: 30,
      q: q || undefined,
    };
    if ('status' in active && active.status) query.status = active.status;
    if ('bookmarked' in active && active.bookmarked) query.bookmarked = active.bookmarked;
    if ('flagged' in active && active.flagged) query.flagged = active.flagged;

    api
      .listQuestions(query)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e.message));
  }, [filter, q, page]);

  function setFilter(key: string) {
    const next = new URLSearchParams(params);
    if (key) next.set('filter', key);
    else next.delete('filter');
    next.set('page', '1');
    setParams(next);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set('q', search.trim());
    else next.delete('q');
    next.set('page', '1');
    setParams(next);
  }

  const pages = Math.max(1, Math.ceil(total / 30));

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Question bank</h1>
      {error ? <div className="error-banner">{error}</div> : null}

      <form className="toolbar" onSubmit={submitSearch}>
        <input
          style={{
            margin: 0,
            minWidth: 220,
            background: '#121820',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search number or title"
        />
        <button className="btn" type="submit">
          Search
        </button>
        {FILTERS.map((f) => (
          <button
            key={f.key || 'all'}
            type="button"
            className={`btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </form>

      <div className="panel" style={{ marginTop: 12 }}>
        {items.map((item) => {
          const st = item.userState?.status;
          return (
            <Link key={item.number} className="list-item" to={`/questions/${item.number}`}>
              <div>
                <strong>Q{item.number}</strong> · {item.title}
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {(item.question?.en || '').slice(0, 120)}
                  {(item.question?.en || '').length > 120 ? '…' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {item.userState?.bookmarked ? <span className="badge">★</span> : null}
                {item.userState?.flagged ? <span className="badge">⚑</span> : null}
                {st === 'answered_correct' ? <span className="badge ok">correct</span> : null}
                {st === 'answered_wrong' ? <span className="badge bad">wrong</span> : null}
                {st === 'revealed' ? <span className="badge">revealed</span> : null}
              </div>
            </Link>
          );
        })}
        {!items.length ? <div style={{ padding: 16 }} className="muted">No questions.</div> : null}
      </div>

      <div className="toolbar" style={{ marginTop: 12 }}>
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set('page', String(page - 1));
            setParams(next);
          }}
        >
          Prev
        </button>
        <span className="muted">
          Page {page} / {pages} · {total} items
        </span>
        <button
          className="btn"
          disabled={page >= pages}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set('page', String(page + 1));
            setParams(next);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
