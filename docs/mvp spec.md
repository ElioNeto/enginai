# AI Dev Agent - Complete MVP Technical Specification

**Version:** 3.0 - Complete MVP (Create + Implement)  
**Date:** January 22, 2026  
**Scope:** Create applications from scratch + Implement features in existing apps  
**Timeline:** 8 weeks  
**Cost:** $0.00/month

---

## EXECUTIVE SUMMARY

### Problem
Developers lose time on:
1. **Creating initial project structure** (boilerplate, configuration)
2. **Implementing repetitive features** in existing projects (endpoints, CRUD, validations)

### MVP Solution
AI Dev Agent that **creates applications from scratch** using templates and **implements simple features** in existing repositories, with a fully automated workflow.

### MVP Scope (What it DOES)

**🆕 CREATE APPLICATIONS FROM SCRATCH:**
✅ REST API (FastAPI, Flask, Express)  
✅ Basic Web App (Angular, React - initial structure)  
✅ Automatic configuration (database, basic authentication)  
✅ Test structure  
✅ Docker + docker-compose  
✅ Basic CI/CD (GitHub Actions)  
✅ README with documentation  

**🔧 IMPLEMENT FEATURES IN EXISTING APPS:**
✅ Read GitHub Issues  
✅ Analyze project structure  
✅ Add REST endpoints  
✅ Implement CRUD  
✅ Create functions/classes  
✅ Add validations  
✅ Fix specific bugs  
✅ Generate unit tests  
✅ Commit, push, and PR  

### MVP Scope (What it DOES NOT DO - V1)
❌ Complex apps (microservices, distributed architectures)  
❌ RAG with Vector Store (deep context analysis)  
❌ Iterative automatic correction (multiple attempts)  
❌ Persistent memory between executions  
❌ Complex features (10+ files, large refactors)  
❌ Graphical interface (V2)  

### MVP Use Cases

**Create from Scratch:**
1. **Full REST API** with CRUD, authentication, database
2. **Angular App** with routing, components, services
3. **Python Script** with CLI, tests, documentation
4. **Basic Microservice** with Docker

**Implement Features:**
1. **Add endpoint** to existing API
2. **Implement CRUD method** in controller
3. **Create component** in Angular app
4. **Add validation** to model
5. **Fix specific bug**

---

## 1. COMPLETE MVP ARCHITECTURE

### 1.1 Overview

```
┌─────────────────────────────────────────────────────┐
│              CLI (Rich Interface)                   │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  Orchestrator  │
         │  (Mode Router) │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │ CREATE     │ IMPLEMENT  │
    ▼            ▼            
┌────────┐   ┌─────────────────────┐
│Scaffold│   │ Planner → Coder →   │
│Service │   │ Tester → Validator  │
└───┬────┘   └─────────┬───────────┘
    │                  │
    └──────────┬───────┘
               │
    ┌──────────┼─────────────┐
    │          │             │
┌───▼───┐  ┌──▼─────┐  ┌───▼─────┐
│ Repo  │  │Template │  │   LLM    │
│Manager│  │ Engine  │  │  Router  │
└───────┘  └─────────┘  └──────────┘
```

### 1.2 MVP Components

**1. CLI (Interface)**
- Commands: `create` (new app) and `implement` (feature)
- Progress bars, logs, confirmations

**2. Orchestrator (Mode Router)**
- Detects mode: CREATE vs IMPLEMENT
- Routes to Scaffolder or Planner

**3. Scaffolder Service (NEW)**
- Generates project structure from templates
- Customizes based on user parameters
- Initializes Git, creates README, configures CI/CD

**4. Template Engine (NEW)**
- Template library for each app type
- Variable substitution (project name, author, etc.)
- Customizable templates via LLM prompts

**5. Planner Agent**
- Analyzes demand and existing repo
- Generates implementation plan (1-5 subtasks)

**6. Coder Agent**
- Generates code (create app or modify)
- Applies changes to files

**7. Tester Agent**
- Generates unit tests
- Validates implementation

**8. Repo Manager**
- Git operations (clone, branch, commit, push, PR)
- New repo initialization

**9. LLM Router**
- Gemini (primary, free) + Ollama (fallback)

---

## 2. DETAILED MODULES

### 2.1 CLI Module

**Commands:**

```bash
# === CREATE NEW APP ===
aidevagent create --type api --name user-service --language python
aidevagent create --type webapp --name dashboard --framework angular
aidevagent create --type script --name data-processor

# === IMPLEMENT FEATURE ===
aidevagent implement --issue <URL>
aidevagent implement --text "add GET /users endpoint" --repo <URL>

# === CONFIGURATION ===
aidevagent config --check
aidevagent config --setup

# === TEMPLATES ===
aidevagent templates --list
aidevagent templates --show api-fastapi
```

---

### 2.2 Scaffolder Service

**Template Selection:**

```python
templates = {
    ('api', 'python', 'fastapi'): 'api-fastapi',
    ('api', 'python', 'flask'): 'api-flask',
    ('api', 'typescript', 'express'): 'api-express',
    ('webapp', 'typescript', 'angular'): 'webapp-angular',
    ('webapp', 'typescript', 'react'): 'webapp-react',
    ('script', 'python', None): 'script-python'
}
```

---

## 3. AVAILABLE TEMPLATES

### 3.1 REST API (FastAPI - Python)

**Features:** Modular structure, optional JWT auth, PostgreSQL/SQLite, full CRUD, Pydantic validation, pytest, Docker, CI/CD, auto OpenAPI docs.

```
user-service/
├── src/ (main, models, routes, schemas, services)
├── tests/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### 3.2 REST API (Express - TypeScript)

**Features:** Modular structure, JWT auth, TypeORM, full CRUD, class-validator, Jest, Docker, ESLint + Prettier.

### 3.3 Web App (Angular)

**Features:** Standard Angular structure, routing, base components, optional auth service, HttpClient, Jasmine tests, production Dockerfile.

### 3.4 Python CLI Script

**Features:** Click CLI, .env config, structured logging, pytest, setup.py.

---

## 4. ENVIRONMENT CONFIGURATION

```bash
# AI DEV AGENT - CONFIGURATION
APP_ENV=dev
LOG_LEVEL=INFO
WORKDIR=~/.aidevagent/workspace

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_BASE_BRANCH=main

GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_DAILY_LIMIT=1450
OLLAMA_HOST=http://localhost:11434
OLLAMA_GPU_ENABLED=true

TEMPLATES_DIR=~/.aidevagent/templates
DEFAULT_AUTHOR=Your Name
DEFAULT_LICENSE=MIT
```

---

## 5. IMPLEMENTATION PLAN (8 WEEKS)

### Sprint 1 (Weeks 1-2): Foundation + Templates
- [ ] Project setup: structure, poetry, .env
- [ ] CLI with `create` and `implement` commands
- [ ] RepoManager: init, clone, branch, commit, push
- [ ] Template Engine: load and process Jinja2 templates
- [ ] 3 base templates (api-fastapi, api-express, webapp-angular)
- [ ] Unit tests: coverage > 60%

### Sprint 2 (Weeks 3-4): Scaffolder + LLM Integration
- [ ] LLMRouter: Gemini + Ollama
- [ ] ScaffolderService: structure generation + LLM customization
- [ ] Generate README with LLM
- [ ] Generate auth module with LLM
- [ ] Generate initial tests with LLM
- [ ] Unit tests: coverage > 70%

### Sprint 3 (Weeks 5-6): Implement Mode
- [ ] PlannerAgent: analysis + plan
- [ ] CoderAgent: code generation
- [ ] TesterAgent: test generation
- [ ] ExecutorService: run commands
- [ ] Unit tests: coverage > 75%

### Sprint 4 (Weeks 7-8): GitHub Integration + Polish
- [ ] GitHub Integration: read Issue, create PR
- [ ] Orchestrator: mode router (CREATE vs IMPLEMENT)
- [ ] Progress bars and UX (Rich)
- [ ] Robust error handling
- [ ] Complete documentation
- [ ] E2E tests: real scenarios
- [ ] Unit tests: coverage > 80%

**Delivery: Week 9 — MVP v1.0.0 🚀**

---

## 6. COMPLETE USE CASES

### Case 1: Create REST API from Scratch

```bash
aidevagent create \
  --type api \
  --name user-service \
  --language python \
  --framework fastapi \
  --database postgres \
  --auth
```

**Result:**
```
✅ Project created at: ./user-service
📝 Next steps:
   cd user-service
   docker-compose up
   # API running at http://localhost:8000
   # Docs at http://localhost:8000/docs
```

**Time:** ~2-3 minutes

### Case 2: Implement Feature in Existing API

```bash
aidevagent implement \
  --issue "https://github.com/user/api/issues/42"
```

Flow: clone → analyze → plan → implement → tests → validate → commit + PR

**Time:** ~3-5 minutes

---

## 7. MVP LIMITATIONS

### What it does NOT do (coming in V1)

❌ Complex apps (distributed microservices)  
❌ RAG / deep analysis (10+ files)  
❌ Iterative auto-correction  
❌ Persistent memory  
❌ Advanced features (multi-repo, monorepos)  

---

## 8. ACCEPTANCE CRITERIA

### CREATE
✅ Given a create command, generates a functional app  
✅ Complete template structure + LLM-customized files  
✅ Tests passing + README + Git initialized  

### IMPLEMENT
✅ Given an Issue, implements simple feature  
✅ Clone, analyze, plan, code (1-3 files), tests, validate, PR created  

### Success Metrics
- CREATE success rate: > 95%
- IMPLEMENT success rate: > 70%
- Average CREATE time: < 3 minutes
- Average IMPLEMENT time: < 5 minutes
- Cost: $0.00
- Test coverage: > 80%

---

## 9. POST-MVP ROADMAP

### V1 (Weeks 9-14): Complex Features + RAG
- ✅ RAG with FAISS (rich context)
- ✅ Auto-correction (3 attempts)
- ✅ Persistent memory (SQLite)
- ✅ Pattern Learner
- ✅ More templates (React, Vue, Django)
- ✅ Complex features (5-10 files)

### V2 (Weeks 15-18): GUI + Advanced
- ✅ Graphical interface (Electron + Angular)
- ✅ Multi-repo support
- ✅ IDE integrations
- ✅ Customizable templates + marketplace

---

**Document generated on:** January 22, 2026  
**Version:** 3.0 (Complete MVP - CREATE + IMPLEMENT)  
**Status:** Ready for implementation  
**Estimated delivery:** 8 weeks  
**Monthly cost:** $0.00
