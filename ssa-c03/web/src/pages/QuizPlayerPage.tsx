import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Question } from '../api/types';
import { BilingualText } from '../components/BilingualText';
import { NoteEditor } from '../components/NoteEditor';
import { OptionCard } from '../components/OptionCard';

type Mode = 'practice' | 'study';

export function QuizPlayerPage() {
  const { number: numberParam } = useParams();
  const number = Number(numberParam);
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const mode = (search.get('mode') as Mode) || 'practice';

  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setError('');
    setSelected([]);
    setRevealed(false);
    setGradedCorrect(null);
    try {
      const [q, list] = await Promise.all([
        api.getQuestion(number),
        api.listQuestions({ page: 1, limit: 1 }),
      ]);
      setQuestion(q);
      setTotal(list.total);
      if (q.userState?.lastSelected?.length) setSelected(q.userState.lastSelected);
      if (
        q.userState?.status === 'answered_correct' ||
        q.userState?.status === 'answered_wrong' ||
        q.userState?.status === 'revealed'
      ) {
        setRevealed(true);
        if (q.userState.status === 'answered_correct') setGradedCorrect(true);
        if (q.userState.status === 'answered_wrong') setGradedCorrect(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [number]);

  useEffect(() => {
    if (!Number.isFinite(number)) return;
    load();
  }, [number, load]);

  const correctSet = useMemo(
    () => new Set((question?.correctAnswers || []).map((k) => k.toUpperCase())),
    [question],
  );

  function toggle(key: string) {
    if (revealed && mode === 'practice') return;
    const k = key.toUpperCase();
    if (question?.questionType === 'multiple') {
      setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
    } else {
      setSelected([k]);
    }
  }

  async function submit() {
    if (!question || !selected.length) return;
    try {
      const session = await api.createSession({
        mode: 'practice',
        questionNumbers: [question.number],
      });
      const result = await api.answerSession(session._id, question.number, selected);
      setRevealed(true);
      setGradedCorrect(Boolean(result.correct));
      if (result.options) {
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                options: result.options || prev.options,
                correctAnswers: result.correctAnswers || prev.correctAnswers,
                summaryNote: result.summaryNote || prev.summaryNote,
              }
            : prev,
        );
      }
      await api.updatePreferences({ lastQuestionNumber: question.number });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    }
  }

  async function reveal() {
    if (!question) return;
    try {
      const session = await api.createSession({
        mode: 'study',
        questionNumbers: [question.number],
      });
      const result = await api.revealSession(session._id, question.number);
      setRevealed(true);
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              options: result.options || prev.options,
              correctAnswers: result.correctAnswers || prev.correctAnswers,
              summaryNote: result.summaryNote || prev.summaryNote,
            }
          : prev,
      );
      await api.updatePreferences({ lastQuestionNumber: question.number });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reveal failed');
    }
  }

  async function toggleBookmark() {
    if (!question) return;
    const next = !(question.userState?.bookmarked);
    const state = await api.patchProgress(question.number, { bookmarked: next });
    setQuestion({ ...question, userState: state });
  }

  async function toggleFlag() {
    if (!question) return;
    const next = !(question.userState?.flagged);
    const state = await api.patchProgress(question.number, { flagged: next });
    setQuestion({ ...question, userState: state });
  }

  async function resetQuestion() {
    if (!question) return;
    try {
      setError('');
      const state = await api.resetProgress(question.number);
      setSelected([]);
      setRevealed(false);
      setGradedCorrect(null);
      setQuestion({ ...question, userState: state });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed');
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      const keys = ['1', '2', '3', '4', '5', '6'];
      const idx = keys.indexOf(e.key);
      if (idx >= 0 && question.options[idx]) {
        toggle(question.options[idx].key);
      }
      if (e.key === 'Enter') {
        if (mode === 'practice') submit();
        else reveal();
      }
      if (e.key === 'ArrowLeft' && number > 1) navigate(`/questions/${number - 1}?mode=${mode}`);
      if (e.key === 'ArrowRight') navigate(`/questions/${number + 1}?mode=${mode}`);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, selected, mode, number, revealed]);

  if (!Number.isFinite(number)) return <div className="error-banner">Invalid question</div>;

  return (
    <div>
      <div className="toolbar">
        <button
          className={`btn ${mode === 'practice' ? 'active' : ''}`}
          onClick={() => {
            const next = new URLSearchParams(search);
            next.set('mode', 'practice');
            setSearch(next);
          }}
        >
          Practice
        </button>
        <button
          className={`btn ${mode === 'study' ? 'active' : ''}`}
          onClick={() => {
            const next = new URLSearchParams(search);
            next.set('mode', 'study');
            setSearch(next);
          }}
        >
          Study
        </button>
        <span className="muted">
          Q{number}
          {total ? ` / ${total}` : ''}
        </span>
        <button className="btn" onClick={toggleBookmark}>
          {question?.userState?.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
        </button>
        <button className="btn" onClick={toggleFlag}>
          {question?.userState?.flagged ? '⚑ Flagged' : '⚑ Flag'}
        </button>
        <button
          className="btn"
          onClick={resetQuestion}
          disabled={!revealed && selected.length === 0}
          title="Xóa lựa chọn / kết quả để làm lại câu này"
        >
          Reset câu này
        </button>
        <Link className="btn btn-ghost" to="/questions">
          Back to list
        </Link>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {!question ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="quiz-layout">
          <div className="panel" style={{ padding: 18 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              {question.title} · {question.questionType}
            </div>
            <BilingualText text={question.question} />
            <div style={{ marginTop: 16 }}>
              {question.options.map((opt) => (
                <OptionCard
                  key={opt.key}
                  option={opt}
                  selected={selected.includes(opt.key.toUpperCase())}
                  showResult={revealed}
                  isCorrectKey={correctSet.has(opt.key.toUpperCase())}
                  onToggle={() => toggle(opt.key)}
                />
              ))}
            </div>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button
                className="btn"
                disabled={number <= 1}
                onClick={() => navigate(`/questions/${number - 1}?mode=${mode}`)}
              >
                ← Prev
              </button>
              {mode === 'practice' ? (
                <button className="btn btn-primary" onClick={submit} disabled={!selected.length || revealed}>
                  Submit answer
                </button>
              ) : (
                <button className="btn btn-primary" onClick={reveal} disabled={revealed}>
                  Reveal answer
                </button>
              )}
              {(revealed || selected.length > 0) && (
                <button className="btn" onClick={resetQuestion}>
                  Làm lại
                </button>
              )}
              <button
                className="btn"
                onClick={() => navigate(`/questions/${number + 1}?mode=${mode}`)}
              >
                Next →
              </button>
              {gradedCorrect === true ? <span className="badge ok">Correct</span> : null}
              {gradedCorrect === false ? <span className="badge bad">Wrong</span> : null}
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <NoteEditor questionNumber={question.number} initialBody={question.note?.body || ''} />
            {revealed ? (
              <div style={{ marginTop: 16 }}>
                <strong>Summary</strong>
                <p className="vi-text" style={{ marginTop: 8 }}>
                  {question.summaryNote || 'No summary yet.'}
                </p>
                <p className="muted" style={{ marginTop: 8 }}>
                  Answer: {(question.correctAnswers || []).join(', ') || '—'}
                </p>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 16 }}>
                Summary & explanations appear after submit/reveal.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
