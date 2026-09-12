# Daily Task Tracker (GitHub-Backed)

A modern, responsive, and secure Daily Task Tracker application where GitHub acts as the persistent backend storage using the **GitHub Contents API**. Every addition, edit, deletion, or status change generates an automated, meaningful commit directly in your GitHub repository.

---

## Features

- **GitHub-Backed Persistence**: Tasks are saved directly as `tasks/YYYY-MM-DD.json` in your repository.
- **Automated Commit History**: Automatically commits each change with meaningful messages (`Add task: ...`, `Update task: ...`, `Delete task: ...`).
- **Secure Authentication**: Your GitHub token is stored securely on the backend server (`.env`) and is **never** leaked or sent to the browser.
- **Complete CRUD Operations**:
  - **Add Task**: Title, description, status (`pending`, `in-progress`, `completed`).
  - **Edit Task**: Modify title, description, and status with automatic SHA conflict handling.
  - **Delete Task**: Confirmation modal prevents accidental deletions.
  - **Quick Status Toggle**: Mark tasks completed with a single click.
- **Search Across History**: Real-time search across task titles, descriptions, and dates with instant jump to date.
- **Date Navigation**: Quick buttons for *Today*, *Yesterday*, plus interactive calendar picker and day steppers.
- **Safe Concurrency**: Automatic retry mechanism on HTTP 409 conflicts.
- **Clean Responsive UI**: GitHub dark theme built with React and Tailwind CSS.

---

## Repository Storage Structure

Tasks are committed under the `tasks/` directory in your repository:

```text
daily-task-tracker/
├── tasks/
│   ├── 2026-09-12.json
│   ├── 2026-09-11.json
│   └── ...
└── README.md
```

Each date file follows this JSON structure:

```json
{
  "date": "2026-09-12",
  "tasks": [
    {
      "id": "task_1726156800000_abc12",
      "task": "Worked on SSO POC",
      "description": "Tested Microsoft authentication flow",
      "status": "completed",
      "createdAt": "2026-09-12T10:00:00Z",
      "updatedAt": "2026-09-12T10:00:00Z"
    }
  ]
}
```

---

## Setup & Configuration

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested with v24)
- A GitHub account and target repository

### 1. Configure GitHub Token

1. Go to **GitHub** &gt; **Settings** &gt; **Developer settings** &gt; **Personal access tokens** &gt; **Fine-grained tokens** (or **Tokens (classic)**).
2. Click **Generate new token**.
3. Under **Repository access**, select **Only select repositories** and pick your task repository (e.g. `daily-task-tracker`).
4. Under **Permissions**, set:
   - **Contents**: `Read and write`
5. Copy the generated token (`github_pat_...` or `ghp_...`).

### 2. Configure Environment (.env)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server Port (default 3001)
PORT=3001

# Your GitHub Personal Access Token (kept server-side only)
GITHUB_TOKEN=ghp_yourActualGitHubTokenHere

# Your GitHub username or organization
GITHUB_OWNER=yourGitHubUsername

# Your GitHub repository name
GITHUB_REPO=daily-task-tracker

# Target branch (default: main)
GITHUB_BRANCH=main

# Directory inside repository for date files (default: tasks)
TASKS_PATH=tasks
```

---

## Running the Application

### Development Mode

Run both the backend API server and Vite client concurrently:

```bash
npm install
npm run dev
```

- **Frontend App**: Open [http://localhost:3000](http://localhost:3000)
- **Backend API**: Running on [http://localhost:3001](http://localhost:3001)

### Production Build & Run

```bash
npm run build
npm start
```

### Running Automated Tests

```bash
npm test
```

---

## Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────┐
│                   Browser / Client                     │
│      React 18 + Tailwind CSS + Lucide Icons            │
│  (Components: TaskList, TaskCard, TaskForm, Search)    │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON (No secrets)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Backend Service (Node.js/Express)         │
│  • Reads .env (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)│
│  • Sanitizes errors and redacts credentials            │
│  • SHA conflict retry & Base64 UTF-8 encoding          │
└──────────────────────────┬─────────────────────────────┘
                           │ GitHub Contents API
                           │ Authorization: Bearer <GITHUB_TOKEN>
                           ▼
┌────────────────────────────────────────────────────────┐
│                   GitHub Repository                    │
│      GET /repos/{owner}/{repo}/contents/tasks/{date}   │
│      PUT /repos/{owner}/{repo}/contents/tasks/{date}   │
│         ↳ Creates git commit in your repository        │
└────────────────────────────────────────────────────────┘
```

### Complete End-to-End Add Flow

```text
User clicks "+ Add Task" and submits form
       ↓
Browser sends POST /api/tasks { date, task, description, status }
       ↓
Backend checks .env credentials securely
       ↓
Backend calls GitHub GET /repos/{owner}/{repo}/contents/tasks/{date}.json
       ↓
If exists: reads SHA and appends new task
If not: creates new DailyTasksFile structure
       ↓
Backend encodes content in Base64 (UTF-8)
       ↓
Backend calls GitHub PUT /repos/{owner}/{repo}/contents/tasks/{date}.json
  with message: "Add task: <task title>" and SHA
       ↓
GitHub creates commit and returns new SHA
       ↓
Backend responds with 201 Created and new task object
       ↓
Browser UI updates immediately with success banner
```

---

## Security Highlights

- **Server-Side Token Storage**: The GitHub Personal Access Token is only held in Node.js server memory.
- **Zero Client Exposure**: The browser client only communicates with the local proxy backend `/api/*`.
- **Sanitized Errors**: All error messages returned to the client and server logs pass through `sanitizeError()`, ensuring tokens and authorization headers are never exposed.
