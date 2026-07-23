import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

type Props = {
  questionNumber: number;
  initialBody?: string;
};

export function NoteEditor({ questionNumber, initialBody = '' }: Props) {
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timer = useRef<number | null>(null);
  const first = useRef(true);

  useEffect(() => {
    setBody(initialBody);
    setStatus('idle');
    first.current = true;
  }, [questionNumber, initialBody]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        setStatus('saving');
        await api.saveNote(questionNumber, body);
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 600);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [body, questionNumber]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <strong>Your note</strong>
        <span className="save-status">
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && 'Save failed'}
        </span>
      </div>
      <textarea
        className="note-box"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ghi chú cá nhân cho câu này…"
      />
    </div>
  );
}
