# Contributing to EnginAI

Thank you for your interest in contributing! 🎉  
EnginAI is open source (MIT) and welcomes contributions of all kinds.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Workflow](#workflow)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/enginai.git
   cd enginai
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ElioNeto/enginai.git
   ```

---

## Development Setup

### Prerequisites

- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **npm** 10+
- **Ollama** (optional, for local LLM fallback) — [ollama.com](https://ollama.com)

### Install & Build

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → dist/
npm test             # Run tests
npm run typecheck    # Type-check without emitting
npm run lint         # ESLint check
```

### Environment

```bash
cp .env.example .env
# Fill in at minimum:
# GEMINI_API_KEY — https://aistudio.google.com/apikey
# GITHUB_TOKEN   — https://github.com/settings/tokens
```

### Run without building

```bash
npx ts-node src/cli/main.ts --help
```

---

## Workflow

1. **Sync** your fork before starting:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/bug-description
   ```
3. **Make your changes** — keep them focused on a single concern.
4. **Write or update tests** — all new code must have coverage.
5. **Run the full suite** before pushing:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```
6. **Push** and open a Pull Request.

---

## Code Style

- **Language:** TypeScript strict mode (`"strict": true` in `tsconfig.json`)
- **Formatter:** Prettier (run `npm run format` or configure your editor)
- **Linter:** ESLint with `@typescript-eslint` rules
- **Naming conventions:**
  - Files & folders: `camelCase.ts`
  - Classes: `PascalCase`
  - Functions & variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Interfaces: `PascalCase` (no `I` prefix)
- **No `any`** — use proper types or `unknown`
- **Async/await** over raw Promises

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer: BREAKING CHANGE or Closes #issue]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without behavior change |
| `test` | Adding or updating tests |
| `chore` | Build scripts, tooling, dependencies |
| `perf` | Performance improvement |

**Examples:**
```
feat(planner): add dependency graph support for subtasks
fix(modelRouter): handle Gemini 503 as transient error
docs(readme): update installation steps for Node.js 20
```

---

## Pull Request Guidelines

- PRs should target the `main` branch
- Title must follow Conventional Commits format
- Include a description of **what** changed and **why**
- Reference related issues: `Closes #42`
- All CI checks must pass before review
- Request review from `@ElioNeto` if unsure who to add
- Keep PRs small and focused — one concern per PR

---

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- EnginAI version (`npm list enginai` or git SHA)
- Node.js version (`node --version`)
- OS and version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (redact any secrets!)

---

## Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml) and describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered
- Any relevant examples or references

---

## Questions?

Open a [Discussion](https://github.com/ElioNeto/enginai/discussions) or check [SUPPORT.md](SUPPORT.md).

Thank you for contributing! 🚀
