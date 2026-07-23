import { LangPair } from '../api/types';

type Props = {
  text: LangPair;
  classNameEn?: string;
  classNameVi?: string;
};

export function BilingualText({ text, classNameEn = 'en-text', classNameVi = 'vi-text' }: Props) {
  return (
    <div>
      <p className={classNameEn}>{text?.en || '—'}</p>
      {text?.vi ? <p className={classNameVi}>{text.vi}</p> : null}
    </div>
  );
}
