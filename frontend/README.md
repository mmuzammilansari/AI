# Xander chat

A Next.js chat interface for the FastAPI agent in `../notebooks/Week 8/Day 39/enterprise_ai_agent_v1`.

## Run locally

1. Start FastAPI from its project directory with `uv run fastapi dev main.py` (or your usual Uvicorn command). It should be available at `http://localhost:8000`.
2. From this directory, run `npm install` once, then `npm run dev`.
3. Open `http://localhost:3000`.

The Next.js route handlers proxy chat and history requests to the backend, so browser CORS settings are not needed. Set `AGENT_API_URL` in `.env.local` if FastAPI runs at a different address:

```env
AGENT_API_URL=http://localhost:8000
```

The frontend sends `POST /ai/chat` a JSON body containing `query` and `session_id`, and requests `GET /ai/history?session_id=...` when a session is opened. Chat transcripts are also saved in this browser's local storage.

## Current backend behavior

In the checked-in backend, `/ai/chat` currently echoes the submitted query and `/ai/history` returns a placeholder string. The interface shows a clear notice for the echoed response. It will render a string response or the first string field among `answer`, `response`, `output`, `message`, and `content` when the LangGraph route returns one. Persisted history should be returned by the history route before chats can sync across devices.

Run `npm run build` to create a production build, then `npm run start` to serve it.
