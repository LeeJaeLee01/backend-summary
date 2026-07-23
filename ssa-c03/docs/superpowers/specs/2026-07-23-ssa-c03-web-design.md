# SAA-C03 Web App — Design Spec

**Date:** 2026-07-23  
**Status:** Approved direction (Approach A + CRA/yarn; remaining UX/API choices locked by implementer)

## Goal

Build a React TypeScript frontend for the existing `ssa-c03` Express + MongoDB question bank so a single default learner can:

- Practice (select answers → grade)
- Study (reveal correct answers / explanations)
- See bilingual content with **English primary, Vietnamese secondary**
- Persist personal notes and progress in MongoDB

## Non-goals

- Multi-user auth / OAuth / roles
- Rewriting the import/enrich pipeline
- Migrating BE to NestJS or TypeScript in this phase
- Vite (explicitly out — use Create React App)

## Architecture

```
ssa-c03/
├── src/          # Express API (extend)
├── web/          # CRA React TypeScript (yarn)
├── docs/         # specs / plans
└── ...
```

| Process | Port | Role |
|---------|------|------|
| MongoDB | 27017 | `ssa_c03` DB |
| Express | 3010 | REST API |
| CRA `web` | 3000 | SPA; `proxy` → `http://localhost:3010` |

Default user is resolved server-side (`username: "default"`). FE never sends auth tokens in v1.

## Data model

### Existing: `questions` (unchanged shape)

Keep current documents: `number`, `source`, `title`, `question.{en,vi}`, `options[]`, `correctAnswers`, `summaryNote`, `questionType`, `importStatus`, `meta`.

### New: `users`

```json
{
  "username": "default",
  "displayName": "Learner",
  "preferences": {
    "langLayout": "bilingual",
    "enPrimary": true,
    "defaultMode": "practice",
    "examQuestionCount": 65,
    "examMinutes": 130
  },
  "createdAt": "<Date>",
  "updatedAt": "<Date>"
}
```

- Unique index on `username`
- Seeded on API boot if missing (`ensureDefaultUser`)

### New: `user_notes`

```json
{
  "userId": "<ObjectId>",
  "questionNumber": 12,
  "source": "topic-1/exam-a",
  "body": "markdown/plain text",
  "updatedAt": "<Date>"
}
```

- Unique compound index: `(userId, questionNumber, source)`
- Empty `body` allowed (upsert on autosave)

### New: `user_question_state`

```json
{
  "userId": "<ObjectId>",
  "questionNumber": 12,
  "source": "topic-1/exam-a",
  "status": "unseen",
  "bookmarked": false,
  "flagged": false,
  "lastSelected": [],
  "attempts": 0,
  "lastResult": null,
  "updatedAt": "<Date>"
}
```

- `status`: `unseen` | `answered_correct` | `answered_wrong` | `revealed`
- `lastResult`: `correct` | `wrong` | `revealed` | `null`
- Unique compound index: `(userId, questionNumber, source)`

### New: `exam_sessions`

```json
{
  "userId": "<ObjectId>",
  "mode": "practice",
  "questionNumbers": [3, 15, 88],
  "answers": { "3": ["B"] },
  "results": { "3": { "correct": true, "selected": ["B"] } },
  "startedAt": "<Date>",
  "endsAt": "<Date|null>",
  "completedAt": "<Date|null>",
  "status": "in_progress"
}
```

- `mode`: `practice` | `study` | `exam`
- Exam: timed (`endsAt`), hide explanations until submit/finish
- Practice/Study: `endsAt` null; optional curated list or “browse all”

## API

CORS enabled for `http://localhost:3000`. All user-scoped routes use default user.

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/health` | existing |
| GET | `/questions` | existing list + optional filters: `status`, `bookmarked`, `flagged`, `q` (title/number search) via join with progress |
| GET | `/questions/:number` | existing; may include `userState` + `note` query flags `?include=state,note` |
| GET | `/me` | default user + preferences + aggregate stats |
| PATCH | `/me/preferences` | merge preferences |
| GET | `/notes/:number` | note for question (empty body if none) |
| PUT | `/notes/:number` | upsert `{ body }` |
| GET | `/progress` | paginated states; filters `status`, `bookmarked`, `flagged` |
| PATCH | `/progress/:number` | update bookmark/flag/status/selection |
| POST | `/sessions` | create session `{ mode, count?, questionNumbers? }` |
| GET | `/sessions/:id` | session detail |
| PATCH | `/sessions/:id/answer` | `{ number, selected[] }` — grades in practice; records only in exam until finish |
| POST | `/sessions/:id/reveal` | study mode reveal for one question |
| POST | `/sessions/:id/finish` | compute score, write progress |

### Grading rules

- Compare selected keys (sorted) to `correctAnswers` (sorted)
- Multi-select: exact set match
- Practice Submit → set `answered_correct` / `answered_wrong`, increment `attempts`
- Study Reveal → set `status: revealed` without requiring prior selection
- Exam answers stored until Finish; then bulk-update progress

## Frontend (`web/`)

### Stack (locked)

- Create React App with TypeScript template
- yarn
- React Router v6
- Plain CSS modules or a single `styles/` folder with CSS variables (no heavy UI kit)
- `fetch` wrapper in `src/api/`

### Routes

| Path | Screen |
|------|--------|
| `/` | Dashboard: stats, continue last question, start Practice/Study/Exam |
| `/questions` | Browser list + filters (All / Unseen / Wrong / Correct / Bookmarked / Flagged) |
| `/questions/:number` | Quiz player (main screen) |
| `/sessions/:id` | Active session runner (exam timer) |
| `/sessions/:id/review` | Post-exam review |
| `/notes` | Notes index (questions that have non-empty notes) |
| `/settings` | Preferences |

### Quiz player UX (locked)

- Top bar: mode pills (Practice / Study / Exam entry), Q n / total, bookmark, flag
- Stem: **EN** bold larger; **VI** muted smaller underneath (same for each option)
- Options: clickable cards; multi-select when `questionType === 'multiple'`
- Actions: Prev / Next / Submit (Practice) / Reveal (Study)
- Right sidebar (≥960px): personal note (debounce autosave 600ms) + bank `summaryNote` + option explanations after grade/reveal
- Mobile: note collapses to bottom drawer / tab

### Visual direction (locked)

- Calm study desk: deep slate background (`#0f1419`), paper panels (`#1a222c`), text `#e7ecf1`
- Accent: AWS-ish orange `#ff9900` for primary CTA / selected state
- Correct: soft green; Wrong: soft red
- Typography: `Source Serif 4` for question stem, `IBM Plex Sans` for UI chrome
- Avoid purple gradients, cream+terracotta cliché, emoji clutter

### Extra features (in scope)

1. Bookmark + flag
2. Filters on question list
3. Timed mock exam (default 65 Q / 130 min, configurable in settings)
4. Dashboard stats: answered, accuracy, bookmarked count, streak of days with activity (simple date set on user or derived)
5. Keyboard: `1–6` select option, `Enter` submit/reveal, `←/→` navigate
6. Resume: remember `lastQuestionNumber` on user preferences
7. Search by question number / title substring

### Out of scope for v1 (nice-to-have later)

- Spaced repetition algorithm
- Export notes to Markdown file
- Dark/light theme toggle (ship dark only)
- Offline PWA

## BE changes required

1. `cors` dependency + middleware
2. `ensureDefaultUser` on startup + indexes
3. New routers: `me`, `notes`, `progress`, `sessions`
4. Extend `listQuestions` / `getQuestion` to optionally merge user state
5. `.env.example`: document `CORS_ORIGIN=http://localhost:3000`
6. README: run API + `cd web && yarn start`

## Error handling

- API: `{ error: string }` JSON; 404 for missing question/session
- FE: toast/banner on network failure; note autosave shows Saving… / Saved / Failed + retry
- Exam overtime: auto-finish on client timer; server also rejects answers after `endsAt`

## Testing (pragmatic)

- BE: manual via curl / existing scripts; optional small node assert scripts for grade helper
- FE: no mandatory E2E in v1; smoke-test checklist in plan (load Q1, submit, note persist, bilingual render)

## Implementation order (for later plan)

1. DB seed + indexes + API routes
2. Scaffold CRA `web` + proxy + types
3. Dashboard + question list
4. Quiz player (Practice + Study + bilingual + notes)
5. Exam sessions + review
6. Settings + keyboard shortcuts + polish

## Decisions log

| Topic | Choice |
|-------|--------|
| Approach | A — CRA in `ssa-c03/web` + extend Express |
| Package manager | yarn |
| Bundler/scaffold | Create React App (TypeScript) |
| Auth | Single seeded `default` user |
| Bilingual | Always both; EN primary, VI secondary |
| Modes | Practice + Study + Exam |
| Notes storage | Mongo `user_notes` |
| Progress storage | Mongo `user_question_state` |
| UI kit | None; custom CSS |
)
