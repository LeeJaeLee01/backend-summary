import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ExamSession, Question } from '../api/types';
import { BilingualText } from '../components/BilingualText';
import { NoteEditor } from '../components/NoteEditor';
import { OptionCard } from '../components/OptionCard';

function formatRemain(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SessionRunnerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [remainMs, setRemainMs] = useState<number | null>(null);
  const [noteBody, setNoteBody] = useState('');

  const loadAt = useCallback(
    async (idx: number) => {
      if (!id) return;
      setError('');
      setRevealed(false);
      setGradedCorrect(null);
      try {
        const bootstrap = await api.getSession(id);
        const sess = bootstrap.session;
        setSession(sess);
        if (sess.status === 'completed') {
          navigate(`/sessions/${id}/review`);
          return;
        }
        const numbers = sess.questionNumbers;
        const safeIdx = Math.min(Math.max(idx, 0), numbers.length - 1);
        setIndex(safeIdx);
        const number = numbers[safeIdx];
        const res = await api.getSession(id, number);
        setSession(res.session);
        setQuestion(res.question);
        const saved = res.session.answers?.[String(number)] || [];
        setSelected(saved);
        const result = res.session.results?.[String(number)];
        if (result) {
          setRevealed(true);
          setGradedCorrect(result.correct);
        }
        const full = await api.getQuestion(number);
        setNoteBody(full.note?.body || '');
        if (res.session.mode !== 'exam' && (result || res.session.mode === 'study')) {
          // keep stripped or enriched as returned
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load session');
      }
    },
    [id, navigate],
  );

  useEffect(() => {
    loadAt(0);
  }, [loadAt]);

  useEffect(() => {
    if (!session?.endsAt || session.mode !== 'exam') {
      setRemainMs(null);
      return;
    }
    const tick = () => {
      const left = new Date(session.endsAt!).getTime() - Date.now();
      setRemainMs(left);
      if (left <= 0 && id) {
        api.finishSession(id).then(() => navigate(`/sessions/${id}/review`));
      }
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [session?.endsAt, session?.mode, id, navigate]);

  const correctSet = useMemo(
    () => new Set((question?.correctAnswers || []).map((k) => k.toUpperCase())),
    [question],
  );

  function toggle(key: string) {
    if (revealed && session?.mode === 'practice') return;
    if (session?.mode === 'exam' && revealed) return;
    const k = key.toUpperCase();
    if (question?.questionType === 'multiple') {
      setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
    } else {
      setSelected([k]);
    }
  }

  async function submitOrSave() {
    if (!id || !question || !session) return;
    try {
      if (session.mode === 'study') {
        // just store selection locally via answer (no grade)
        await api.answerSession(id, question.number, selected);
        return;
      }
      const result = await api.answerSession(id, question.number, selected);
      if (result.graded) {
        setRevealed(true);
        setGradedCorrect(Boolean(result.correct));
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                options: result.options || prev.options,
                correctAnswers: result.correctAnswers || [],
                summaryNote: result.summaryNote || '',
              }
            : prev,
        );
      } else {
        // exam: saved
        setSession((prev) =>
          prev
            ? {
                ...prev,
                answers: { ...prev.answers, [String(question.number)]: selected },
              }
            : prev,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Answer failed');
    }
  }

  async function reveal() {
    if (!id || !question) return;
    try {
      const result = await api.revealSession(id, question.number);
      setRevealed(true);
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              options: result.options,
              correctAnswers: result.correctAnswers,
              summaryNote: result.summaryNote,
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reveal failed');
    }
  }

  async function finish() {
    if (!id) return;
    await api.finishSession(id);
    navigate(`/sessions/${id}/review`);
  }

  if (!session) {
    return error ? <div className="error-banner">{error}</div> : <p className="muted">Loading session…</p>;
  }

  const total = session.questionNumbers.length;
  const currentNumber = session.questionNumbers[index];

  return (
    <div>
      <div className="toolbar">
        <span className="badge">{session.mode.toUpperCase()}</span>
        <span className="muted">
          {index + 1} / {total} · Q{currentNumber}
        </span>
        {remainMs != null ? (
          <span className={`badge ${remainMs < 5 * 60 * 1000 ? 'bad' : ''}`}>
            ⏱ {formatRemain(remainMs)}
          </span>
        ) : null}
        {session.mode === 'exam' ? (
          <button className="btn btn-primary" onClick={finish}>
            Finish exam
          </button>
        ) : null}
        <Link className="btn btn-ghost" to="/">
          Exit
        </Link>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="quiz-layout">
        <div className="panel" style={{ padding: 18 }}>
          {question ? (
            <>
              <div className="muted" style={{ marginBottom: 8 }}>
                {question.title}
              </div>
              <BilingualText text={question.question} />
              <div style={{ marginTop: 16 }}>
                {question.options.map((opt) => (
                  <OptionCard
                    key={opt.key}
                    option={opt}
                    selected={selected.includes(opt.key.toUpperCase())}
                    showResult={revealed && session.mode !== 'exam'}
                    isCorrectKey={correctSet.has(opt.key.toUpperCase())}
                    onToggle={() => toggle(opt.key)}
                  />
                ))}
              </div>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="btn" disabled={index <= 0} onClick={() => loadAt(index - 1)}>
                  ← Prev
                </button>
                {session.mode === 'practice' ? (
                  <button className="btn btn-primary" onClick={submitOrSave} disabled={!selected.length}>
                    Submit
                  </button>
                ) : null}
                {session.mode === 'study' ? (
                  <button className="btn btn-primary" onClick={reveal}>
                    Reveal
                  </button>
                ) : null}
                {session.mode === 'exam' ? (
                  <button className="btn btn-primary" onClick={submitOrSave}>
                    Save answer
                  </button>
                ) : null}
                <button
                  className="btn"
                  disabled={index >= total - 1}
                  onClick={() => loadAt(index + 1)}
                >
                  Next →
                </button>
                {gradedCorrect === true ? <span className="badge ok">Correct</span> : null}
                {gradedCorrect === false ? <span className="badge bad">Wrong</span> : null}
              </div>
            </>
          ) : (
            <p className="muted">Loading question…</p>
          )}
        </div>

        <div className="panel" style={{ padding: 16 }}>
          {question ? (
            <NoteEditor questionNumber={question.number} initialBody={noteBody} />
          ) : null}
          {revealed && session.mode !== 'exam' && question ? (
            <div style={{ marginTop: 16 }}>
              <strong>Summary</strong>
              <p className="vi-text" style={{ marginTop: 8 }}>
                {question.summaryNote || 'No summary yet.'}
              </p>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 16 }}>
              {session.mode === 'exam'
                ? 'Answers are graded when you finish the exam.'
                : 'Notes autosave. Summary after grade/reveal.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
