<![CDATA[<div align="center">

# ⚙️ EnginAI

**AI-powered developer agent that creates full applications from scratch and implements features automatically.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cost](https://img.shields.io/badge/Cost-$0.00%2Fmonth-brightgreen)](https://aistudio.google.com)
[![Status](https://img.shields.io/badge/Status-MVP-orange)](docs/mvp%20spec.md)

</div>

---

## What is EnginAI?

EnginAI is a CLI agent that combines **Gemini** (free) and **Ollama** (local) to automate two core developer workflows:

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
    CLI["🖥️ CLI\n(click + rich)"]

    CLI --> ORC["⚙️ Orchestrator\nMode Router"]

    ORC -->|CREATE| SCAF["📦 Scaffolder Service\nTemplate Engine"]
    ORC -->|IMPLEMENT| PLAN["🧠 Planner Agent\nBreaks demand into subtasks"]

    PLAN --> CODE["💻 Coder Agent\nGenerates / modifies code"]
    CODE --> TEST["🧪 Tester Agent\nGenerates unit tests"]

    SCAF --> REPO
    TEST --> REPO["🐙 Repo Manager\ngit + GitHub API"]

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
    CLI->>Scaffolder: generate_structure(type, name, language, framework)
    Scaffolder->>LLM Router: customize README, auth module, tests
    LLM Router-->>Scaffolder: generated files
    Scaffolder-->>CLI: project path
    CLI->>RepoManager: init_repo + initial commit
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
    CLI->>RepoManager: clone_repo
    RepoManager-->>CLI: local repo path
    CLI->>Planner: create_plan(demand, repo_path)
    Planner-->>CLI: plan with subtasks
    CLI->>Coder: implement_plan(plan, repo_path)
    Coder-->>CLI: modified files
    CLI->>Tester: generate_tests(changes, repo_path)
    Tester-->>CLI: test files
    CLI->>RepoManager: branch + commit + push + PR
    RepoManager-->>Dev: ✅ Pull Request opened (~3-5 min)
```

---

## 📁 Project Structure

```
enginai/
├── src/
│   ├── agents/
│   │   ├── planner.py       # Breaks demand into subtasks
│   │   ├── coder.py         # Generates and modifies code
│   │   └── tester.py        # Generates unit tests
│   ├── core/
│   │   ├── orchestrator.py  # Main flow coordinator
│   │   └── model_router.py  # Routes requests to Gemini or Ollama
│   ├── services/
│   │   └── scaffolder.py    # Project structure generation
│   ├── adapters/
│   │   └── repo_manager.py  # Git & GitHub operations
│   └── cli/
│       └── main.py          # CLI entry point
├── docs/
│   ├── mvp spec.md          # MVP specification
│   ├── tech spec.md         # Technical specification
│   └── stack.md             # Stack & infrastructure details
├── .env.example
├── requirements.txt
└── README.md
```

---

## 🚀 Installation

```bash
# 1. Clone the repository
git clone https://github.com/ElioNeto/enginai.git
cd enginai

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys (see Configuration section)
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
enginai create --type api --name user-service --language python --framework fastapi --database postgres --auth
enginai create --type webapp --name dashboard --framework angular
enginai create --type script --name data-processor

# --- IMPLEMENT: feature in existing repo ---
enginai implement --issue "https://github.com/user/repo/issues/42"
enginai implement --text "add GET /users endpoint" --repo "https://github.com/user/repo"

# --- UTILS ---
enginai config --check
enginai templates --list
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
        RAG with FAISS                     :2026-04-01, 3w
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
]]>