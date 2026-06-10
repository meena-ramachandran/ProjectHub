# Meena.Dev - Live Cloud Deployment Documentation Guide

This guide details how to deploy the **actual codebases** of **RAGChatbot**, **FinSight**, **StockVibe**, and **StudyBuddy** on free cloud platforms (Vercel and Render) using the configuration files we have generated. 

The **Patient Management System** (PMS) remains configured as an interactive visual simulator on the Project Hub dashboard.

---

## 1. RAGChatbot (Next.js Application)

### Hosting Frameworks:
- **Application Frontend & APIs**: Vercel (Free Next.js hosting).
- **Database & Vector Database**: Supabase (Free PostgreSQL database with Vector extension).
- **Task Broker Queue**: Upstash (Free Redis instance).

### Deployment Steps:
1. **Prepare Supabase Database**:
   Log in to Supabase and execute the SQL query to create the tables:
   ```sql
   CREATE TABLE documents (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid,
     file_name text,
     storage_path text,
     created_at timestamp DEFAULT now()
   );
   
   CREATE TABLE chunks (
     id serial PRIMARY KEY,
     document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
     chunk_text text,
     embedding vector(384),  -- matches Xenova's MiniLM embedding dimension
     token_count integer
   );
   ```
2. **Deploy next.js to Vercel**:
   Go to [Vercel](https://vercel.com), click **Add New** -> **Project**, import your `RAGChatbot` repository.
3. **Configure Environment Variables**:
   In Vercel, set these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_SERVICE_ROLE_URL` (Postgres connector string)
   - `GEMINI_API_KEY` (Google Cloud GenAI key)
   - `REDIS_URL` (e.g. from Upstash Redis)
   - `JWT_SECRET` (any random string)
4. **Deploy Background Worker (worker.js)**:
   The background BullMQ worker extracts PDF texts and saves vectors. Deploy it as a background worker on **Render** using a custom environment linking your same `REDIS_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. FinSight (React Frontend + Express Backend)

We have configured separate deployment pathways for the frontend and backend.

### 2.1 Frontend Deployment (Vercel):
- **Directory**: `finance-buddy-app-frontend/`
- **Steps**:
  1. Open [Vercel](https://vercel.com), add a new project, import your `FinSight` repository.
  2. Set the **Root Directory** to `finance-buddy-app-frontend`.
  3. Under Build & Development Settings, select **Create React App** framework.
  4. Deploy! The routes will be rewritten to `/index.html` as set in the generated [vercel.json](file:///Users/meena/.gemini/antigravity/scratch/FinSight/finance-buddy-app-frontend/vercel.json).

### 2.2 Backend Deployment (Render):
- **Directory**: `finance-buddy-app-backend/`
- **Steps**:
  1. Go to [Render](https://render.com).
  2. Click **New** -> **Web Service**.
  3. Import the `FinSight` repository and set the **Root Directory** to `finance-buddy-app-backend` (or click **Blueprint** and import [render.yaml](file:///Users/meena/.gemini/antigravity/scratch/FinSight/finance-buddy-app-backend/render.yaml)).
  4. In Render, set these Environment Variables:
     - `MONGODB_URI` (MongoDB connection string, e.g. from free MongoDB Atlas)
     - `GEMINI_API_KEY`
     - `JWT_SECRET`

---

## 3. StockVibe (Vanilla JS Frontend + FastAPI Backend)

### 3.1 Backend Deployment (Render):
- **Directory**: `backend/`
- **Steps**:
  1. Open [Render](https://render.com), click **New** -> **Web Service**, import the `StockVibe` repository.
  2. Set the **Root Directory** to `backend`.
  3. Select **Docker** as the Environment runtime (Render will automatically detect the generated [Dockerfile](file:///Users/meena/.gemini/antigravity/scratch/StockVibe/backend/Dockerfile)).
  4. Set the Environment Variables:
     - `NEWSAPI_KEY` (newsapi.org free key)
     - `FINNHUB_API_KEY`
  5. Deploy! Once deployed, note down the Render service URL (e.g. `https://stockvibe-backend.onrender.com`).

### 3.2 Frontend Deployment (Vercel):
- **Directory**: `frontend/`
- **Steps**:
  1. In [StockVibe/frontend/index.html](file:///Users/meena/.gemini/antigravity/scratch/StockVibe/frontend/index.html), verify that `API_BASE` points to your newly deployed backend Render URL (the code automatically handles switching to Render in production and localhost in development!).
  2. In Vercel, import the repository and set the **Root Directory** to `frontend`.
  3. Deploy!

---

## 4. StudyBuddy (Flask Application)

- **Platform**: Render.
- **Steps**:
  1. Open [Render](https://render.com), click **New** -> **Web Service**, and import the `StudyBuddy` repository.
  2. Set the **Root Directory** to `study-planner` (or import via the generated blueprint [render.yaml](file:///Users/meena/.gemini/antigravity/scratch/StudyBuddy/study-planner/render.yaml)).
  3. Note: Since `StudyBuddy` utilizes local deep learning and embedding frameworks (PyTorch, sentence-transformers, Coqui TTS, and local Ollama), running it on Render's free tier (512MB RAM limit) will cause Out Of Memory (OOM) failures.
  4. **Production Alternative**: To host this in the cloud, configure the agents in the code to route calls to the cloud **Gemini API** or **OpenAI API** instead of local Ollama, and replace Coqui TTS with a lightweight cloud synthesis endpoint.
  5. **Local Quick-Start**: Run the app locally to leverage your machine's hardware:
     ```bash
     cd StudyBuddy/study-planner/backend
     pip install -r requirements.txt
     python app.py
     ```
