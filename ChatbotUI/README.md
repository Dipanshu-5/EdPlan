# EduPlan React UI

This repository now contains a React 18 / Vite implementation of the EduPlan experience (chatbot, education plan builder, scheduling, and university exploration). It replaces the previous Angular/TypeScript project with a JavaScript-first stack.

## Tech stack

- Vite 6 + React 18
- React Router 6
- Axios for API calls
- Zustand-ready architecture for future global state (not yet required)
- Tailwind utility classes (via PostCSS) for layout polish

## Getting started

```bash
pnpm install    # or npm/yarn
pnpm run dev    # starts Vite dev server on http://localhost:5173
```

> Configure the API endpoint via `.env` before running the app:
>
> ```env
> VITE_API_BASE_URL=http://localhost:8000/api
> ```

### Build & preview

```bash
pnpm run build   # generates a production build in dist/
pnpm run preview # serves the production bundle locally
```

## Project layout

- `src/main.jsx` – React entry point
- `src/App.jsx` – Router definitions
- `src/pages/**` – Top-level pages used by the router
- `src/components/**` – Feature components (chatbot, planner, scheduling, etc.)
- `src/services/**` – Data access and NLP helpers
- `public/assets/**` – Static JSON datasets and imagery reused from the Angular app

## Migrated functionality

- Chatbot with university search and comparison powered by the original NLP heuristics
- Landing workspace with dashboard, education plan editor/viewer, scheduling tool, and support chat
- University catalogue browsing and program detail modal
- Authentication and education plan persistence now target the FastAPI backend (`fastapi_backend/`)

## Next steps

- Wire up end-to-end tests (Playwright or Cypress) once flows stabilise
- Adopt a state store (Zustand) for cross-page session data
- Harden API error handling and optimistic updates

The Angular code has been removed as part of the migration; refer to the Git history if you need to revisit the previous implementation.
