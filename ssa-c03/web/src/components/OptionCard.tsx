import { QuestionOption } from '../api/types';

type Props = {
  option: QuestionOption;
  selected: boolean;
  showResult: boolean;
  isCorrectKey: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

function formatExplanation(raw: string, isCorrect: boolean) {
  const text = raw.trim();
  if (!text) return '';
  if (/^(✅|✔|Đúng|Sai|Correct|Wrong)/i.test(text)) return text;
  return isCorrect ? `✅ Đúng: ${text}` : `Sai: ${text}`;
}

export function OptionCard({
  option,
  selected,
  showResult,
  isCorrectKey,
  disabled,
  onToggle,
}: Props) {
  let cls = 'option';
  if (selected) cls += ' selected';
  if (showResult && isCorrectKey) cls += ' correct';
  if (showResult && selected && !isCorrectKey) cls += ' wrong';

  const explanation =
    showResult && option.explanation
      ? formatExplanation(option.explanation, isCorrectKey)
      : '';

  return (
    <button type="button" className={cls} onClick={onToggle} disabled={disabled}>
      <div style={{ display: 'flex', gap: 10 }}>
        <strong>{option.key}.</strong>
        <div style={{ flex: 1 }}>
          <p className="en-text">{option.text?.en || '—'}</p>
          {option.text?.vi ? <div className="vi-text">{option.text.vi}</div> : null}
          {explanation ? (
            <p className={`option-expl ${isCorrectKey ? 'ok' : 'bad'}`}>{explanation}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
