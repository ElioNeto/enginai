<div align="center">

# ⚙️ EnginAI

**AI-powered developer agent that creates full applications from scratch and implements features automatically.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cost](https://img.shields.io/badge/Cost-$0.00%2Fmonth-brightgreen)](https://aistudio.google.com)
[![Status](https://img.shields.io/badge/Status-MVP-orange)](docs/mvp%20spec.md)

</div>

---

## What is EnginAI?

EnginAI is a CLI agent built with **Node.js + TypeScript** that combines **Gemini** (free) and **Ollama** (local) to automate two core developer workflows:

- **`create`** — Scaffolds a complete project (API, webapp, script) from a single command
- **`implement`** — Reads a GitHub Issue or text description, codes the feature, generates tests, and opens a Pull Request automatically

Zero cloud costs. Runs entirely on free-tier and local models.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🆕 **CREATE** | Generates APIs, web apps, and scripts from scratch |
| 🔧 **IMPLEMENT** | Implements features in existing repos via Issue or text |
| 🧪 **AUTO TESTS** | Automatically generates unit tests for every change |
| 🤖 **LLM ROUTING** | Uses Gemini (primary) with Ollama as local fallback |
| 🐙 **GIT NATIVE** | Branches, commits, and opens PRs automatically |
| 💸 **ZERO COST** | Gemini free tier + Ollama local = $0.00/month |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    CLI["🖥️ CLI\n(Commander + Chalk)"]

    CLI --> ORC["⚙️ Orchestrator\nMode Router"]

    ORC -->|CREATE| SCAF["📦 Scaffolder Service\nFile Generator"]
    ORC -->|IMPLEMENT| PLAN["🧠 Planner Agent\nBreaks demand into subtasks"]

    PLAN --> CODE["💻 Coder Agent\nGenerates / modifies code"]
    CODE --> TEST["🧪 Tester Agent\nGenerates unit tests"]

    SCAF --> REPO
    TEST --> REPO["🐙 Repo Manager\nsimple-git + GitHub API"]

    REPO --> LLM["🤖 LLM Router"]
    LLM -->|primary| GEM["✨ Gemini\n(free tier)"]
    LLM -->|fallback| OLL["🦙 Ollama\n(local)"]
```

---

## 🔄 Workflows

### CREATE — New project from scratch

```mermaid
sequenceDiagram
    actor Dev
    participant CLI
    participant Scaffolder
    participant LLM Router
    participant RepoManager

    Dev->>CLI: enginai create --type api --name my-service
    CLI->>Scaffolder: generateStructure(type, name, language, framework)
    Scaffolder->>LLM Router: customize README, auth module, tests
    LLM Router-->>Scaffolder: generated files
    Scaffolder-->>CLI: project path
    CLI->>RepoManager: initRepo + initial commit
    RepoManager-->>Dev: ✅ Project ready (~2-3 min)
```

### IMPLEMENT — Feature in existing repo

```mermaid
sequenceDiagram
    actor Dev
    participant CLI
    participant Planner
    participant Coder
    participant Tester
    participant RepoManager

    Dev->>CLI: enginai implement --issue <URL>
    CLI->>RepoManager: cloneRepo
    RepoManager-->>CLI: local repo path
    CLI->>Planner: createPlan(demand, repoPath)
    Planner-->>CLI: plan with subtasks
    CLI->>Coder: implementPlan(plan, repoPath)
    Coder-->>CLI: modified files
    CLI->>Tester: generateTests(changes, repoPath)
    Tester-->>CLI: test files
    CLI->>RepoManager: createBranch + commit + push + PR
    RepoManager-->>Dev: ✅ Pull Request opened (~3-5 min)
```

---

## 📁 Project Structure

```
enginai/
├── src/
│   ├── agents/
│   │   ├── planner.ts         # Breaks demand into subtasks
│   │   ├── planner.test.ts    # Unit tests
│   │   ├── coder.ts           # Generates and modifies code
│   │   └── tester.ts          # Generates unit tests
│   ├── core/
│   │   ├── orchestrator.ts    # Main flow coordinator
│   │   └── modelRouter.ts     # Routes requests to Gemini or Ollama
│   ├── services/
│   │   └── scaffolder.ts      # Project structure generation
│   ├── adapters/
│   │   ├── repoManager.ts     # Git & GitHub operations
│   │   └── repoManager.test.ts
│   ├── config/
│   │   └── index.ts           # Environment config loader
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   └── cli/
│       └── main.ts            # CLI entry point (Commander)
├── docs/
│   ├── mvp spec.md            # MVP specification
│   ├── tech spec.md           # Technical specification
│   └── stack.md               # Stack & infrastructure details
├── dist/                      # Compiled output (generated)
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.ts
└── README.md
```

---

## 🚀 Installation

```bash
# Prerequisites: Node.js 20+ (https://nodejs.org)

# 1. Clone the repository
git clone https://github.com/ElioNeto/enginai.git
cd enginai

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Configure environment
cp .env.example .env
# Edit .env with your API keys (see Configuration section)

# 5. (Optional) Install globally
npm install -g .
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in your keys:

```bash
# App
APP_ENV=dev
LOG_LEVEL=INFO
WORKDIR=~/.enginai/workspace

# GitHub
GITHUB_TOKEN=ghp_...           # https://github.com/settings/tokens
DEFAULT_BASE_BRANCH=main

# LLMs
GEMINI_API_KEY=AIzaSy...       # https://aistudio.google.com/apikey
GEMINI_DAILY_LIMIT=1450
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b

# Templates
TEMPLATES_DIR=~/.enginai/templates
DEFAULT_AUTHOR=Your Name
DEFAULT_LICENSE=MIT
```

---

## 🛠️ Usage

```bash
# --- CREATE: new project from scratch ---
enginai create --type api --name user-service --language python --framework fastapi
enginai create --type api --name user-service --language typescript --framework express --database postgres --auth
enginai create --type webapp --name dashboard --framework angular
enginai create --type script --name data-processor

# --- IMPLEMENT: feature in existing repo ---
enginai implement --repo https://github.com/user/repo --issue https://github.com/user/repo/issues/42
enginai implement --repo https://github.com/user/repo --text "add GET /users endpoint"

# --- UTILS ---
enginai config --check

# --- DEV (without build) ---
npx ts-node src/cli/main.ts create --type api --name demo --language typescript --framework express
```

---

## 🧪 Tests

```bash
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run typecheck       # TypeScript type checking only
npm run lint            # ESLint
```

---

## 🗺️ Roadmap

```mermaid
gantt
    title EnginAI Roadmap
    dateFormat  YYYY-MM-DD
    section MVP (v0.x)
        Foundation + CLI + Templates       :done, 2026-01-22, 2w
        Scaffolder + LLM Integration       :done, 2026-02-05, 2w
        Implement Mode (Planner/Coder)     :active, 2026-02-19, 2w
        GitHub Integration + Polish        :2026-03-05, 2w
    section V1
        RAG with FAISS (via Python bridge) :2026-04-01, 3w
        Auto-correction (3 attempts)       :2026-04-22, 2w
        Persistent memory + more templates :2026-05-06, 2w
    section V2
        GUI (Electron + Angular)           :2026-06-01, 4w
        IDE integrations + marketplace     :2026-07-01, 3w
```

---

## 📖 Documentation

- [MVP Specification](docs/mvp%20spec.md)
- [Technical Specification](docs/tech%20spec.md)
- [Stack & Infrastructure](docs/stack.md)

---

## 📄 License

MIT © [Elio Neto](https://github.com/ElioNeto)
