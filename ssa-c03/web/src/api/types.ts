export type LangPair = { en: string; vi: string };

export type QuestionOption = {
  key: string;
  text: LangPair;
  explanation?: string;
};

export type ProgressStatus =
  | 'unseen'
  | 'answered_correct'
  | 'answered_wrong'
  | 'revealed';

export type UserState = {
  questionNumber: number;
  source: string;
  status: ProgressStatus;
  bookmarked: boolean;
  flagged: boolean;
  lastSelected: string[];
  attempts: number;
  lastResult: 'correct' | 'wrong' | 'revealed' | null;
  updatedAt?: string | null;
};

export type UserNote = {
  questionNumber: number;
  source: string;
  body: string;
  updatedAt?: string | null;
  title?: string;
};

export type Question = {
  _id?: string;
  number: number;
  source: string;
  title: string;
  question: LangPair;
  options: QuestionOption[];
  correctAnswers: string[];
  summaryNote: string;
  questionType: 'single' | 'multiple';
  importStatus?: string;
  userState?: UserState | null;
  note?: UserNote;
};

export type Preferences = {
  langLayout: string;
  enPrimary: boolean;
  defaultMode: 'practice' | 'study' | 'exam';
  examQuestionCount: number;
  examMinutes: number;
  lastQuestionNumber: number;
  lastSource: string;
};

export type User = {
  _id: string;
  username: string;
  displayName: string;
  preferences: Preferences;
};

export type Stats = {
  totalQuestions: number;
  answeredCorrect: number;
  answeredWrong: number;
  revealed: number;
  bookmarked: number;
  flagged: number;
  withNotes: number;
  graded: number;
  accuracy: number | null;
  streakDays: number;
};

export type ExamSession = {
  _id: string;
  mode: 'practice' | 'study' | 'exam';
  source: string;
  questionNumbers: number[];
  answers: Record<string, string[]>;
  results: Record<string, { correct: boolean; selected: string[] }>;
  currentIndex?: number;
  startedAt: string;
  endsAt: string | null;
  completedAt: string | null;
  status: 'in_progress' | 'completed';
  score?: { correct: number; total: number; percent: number };
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
