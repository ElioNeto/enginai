# Changelog

All notable changes to EnginAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `feat(agents)` — PlannerAgent, CoderAgent, TesterAgent in TypeScript
- `feat(core)` — MainOrchestrator + ModelRouter (Gemini → Ollama fallback)
- `feat(adapters)` — RepoManager with `simple-git` + GitHub REST API
- `feat(services)` — ScaffolderService with Nunjucks templates
- `feat(cli)` — `create`, `implement`, `config` commands via Commander.js
- `feat(config)` — Typed `.env` loader with Zod validation
- `feat(types)` — Shared TypeScript interfaces (`Plan`, `FileChange`, `LLMResponse`, etc.)
- `test` — Jest + ts-jest setup, unit tests for Planner and RepoManager
- `chore` — ESLint, Prettier, tsconfig strict mode
- `docs` — Full documentation: README, tech spec, stack, MVP spec
- `chore` — Community health files: LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY

### Changed
- **Breaking:** Migrated entire codebase from Python to **Node.js 20 + TypeScript 5.5**
- All source files renamed from `snake_case.py` → `camelCase.ts`
- CLI entry point: `src/cli/main.py` → `src/cli/main.ts` (Commander.js)
- Dependency manager: `pip/poetry` → `npm`

### Removed
- All Python source files (`*.py`) — replaced by TypeScript equivalents
- `requirements.txt` — replaced by `package.json`

---

## [0.1.0] — 2026-01-22

### Added
- Initial project structure (Python)
- Basic CLI skeleton
- Core architecture design
- Technical specification and MVP spec documents
- Zero-cost stack design: Gemini (free) + Ollama (local)

---

[Unreleased]: https://github.com/ElioNeto/enginai/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ElioNeto/enginai/releases/tag/v0.1.0
